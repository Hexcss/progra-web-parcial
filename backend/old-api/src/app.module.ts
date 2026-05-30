import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule, registerEnumType } from '@nestjs/graphql';
import { join } from 'path';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import { envSchema } from './config/env.validation';
import { appConfig } from './config/app.config';
import { AppLogger } from './common/logger/logger.service';
import { DatabaseModule } from './shared/database/database.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { ProductsModule } from './modules/products/products.module';
import { AuthModule } from './modules/auth/auth.module';
import { CoreModule } from './shared/core/core.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { DiscountsModule } from './modules/discounts/discount.module';
import { FilesModule } from './shared/files/files.module';
import { OrdersModule } from './modules/orders/orders.module';
import { EmailModule } from './shared/email/email.module';
import { Role } from './common/enums/role.enum';

registerEnumType(Role, { name: 'Role' });

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
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      sortSchema: true,
      path: '/graphql',
      context: ({ req, res }) => ({ req, res }),
      buildSchemaOptions: { dateScalarMode: 'isoDate' },
      resolvers: { Upload: GraphQLUpload },
    }),
    HealthModule,
    DatabaseModule,
    EmailModule,
    AuthModule,
    UsersModule,
    FilesModule,
    CategoriesModule,
    ProductsModule,
    ReviewsModule,
    DiscountsModule,
    OrdersModule
  ],
  providers: [AppLogger],
  exports: [AppLogger],
})
export class AppModule {}
