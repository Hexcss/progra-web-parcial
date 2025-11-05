import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './config/env.validation';
import { appConfig } from './config/app.config';
import { AppLogger } from './common/logger/logger.service';
import { DatabaseModule } from './shared/database/database.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { ProductsModule } from './modules/products/products.module';
import { AuthModule } from './modules/auth/auth.module';
import { CoreModule } from './shared/core/core.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: false,
      load: [appConfig],
      validate: (config: Record<string, unknown>) => {
        const parsed = envSchema.safeParse(config);
        if (!parsed.success) {
          throw new Error(
            'Invalid environment variables:\n' +
              JSON.stringify(parsed.error.format(), null, 2),
          );
        }
        return parsed.data;
      },
    }),
    CoreModule,
    
    HealthModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProductsModule,
  ],
  providers: [AppLogger],
  exports: [AppLogger],
})
export class AppModule {}
