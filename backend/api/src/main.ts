import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import helmet from 'helmet';
import morgan from 'morgan';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppLogger } from './common/logger/logger.service';
import { requestIdMiddleware } from './common/middlewares/request-id.middleware';
import { ValidationPipe } from './common/pipes/validation.pipe';
import cookieParser from 'cookie-parser';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, logger: ['error', 'warn', 'log', 'debug'] });
  const cfg = app.get(ConfigService);

  const logger = app.get(AppLogger);
  app.useLogger(logger);

  app.use(requestIdMiddleware);
  app.use(helmet());

  const origins = cfg.get<string[]>('corsOrigins') ?? [];
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);

      const allowed = origins.length > 0 ? origins : ['http://localhost:5173', 'https://store.hexcss.com'];
      if (allowed.includes(origin)) return cb(null, true);

      return cb(new Error(`Not allowed by CORS: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });


  app.use(cookieParser());

  app.use(
    morgan('combined', {
      stream: {
        write: (message: string) => logger.log(message.trim(), 'HTTP'),
      },
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor(logger));
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.useGlobalPipes(new ValidationPipe(logger));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Template')
    .setDescription('Reusable NestJS API template for microservices')
    .setVersion('1.0')
    .build();

  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDoc);

  if (process.env.NODE_ENV !== 'production') {
    const docsDir = join(process.cwd(), 'docs');
    mkdirSync(docsDir, { recursive: true });

    const docsPath = join(docsDir, 'openapi.json');
    writeFileSync(docsPath, JSON.stringify(swaggerDoc, null, 2));
    logger.log(`Swagger JSON exported to ${docsPath}`, 'Bootstrap');
  } else {
    logger.log('Production mode: Swagger JSON file not generated', 'Bootstrap');
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`Server running on http://localhost:${port}`, 'Bootstrap');
  logger.log(`Docs at /docs (UI active even in prod)`, 'Bootstrap');
}

void bootstrap();
