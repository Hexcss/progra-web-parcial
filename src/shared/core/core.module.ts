// src/shared/core/core.module.ts
import {
  forwardRef,
  Global,
  Module,
  OnModuleInit,
  ValidationPipe,
} from '@nestjs/common';
import {
  APP_GUARD,
  APP_INTERCEPTOR,
  APP_FILTER,
  APP_PIPE,
  ModuleRef,
} from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthenticationGuard } from '../../common/guards/authentication.guard';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';
import { useContainer } from 'class-validator';
import { UsersModule } from '../../modules/users/users.module';
import { AuthModule } from '../../modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppLogger } from 'src/common/logger/logger.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => [
        {
          ttl: Number(cfg.get('RATE_LIMIT_TTL_MS') ?? 60_000),
          limit: Number(cfg.get('RATE_LIMIT_LIMIT') ?? 500),
        },
      ],
    }),
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
  ],
  providers: [
    AppLogger,
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: false,
          transform: true,
          transformOptions: { enableImplicitConversion: true },
          validationError: { target: false, value: false },
          stopAtFirstError: false,
        }),
    },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthenticationGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class CoreModule implements OnModuleInit {
  constructor(private readonly moduleRef: ModuleRef) {}
  onModuleInit() {
    useContainer(this.moduleRef, { fallbackOnErrors: true });
  }
}
