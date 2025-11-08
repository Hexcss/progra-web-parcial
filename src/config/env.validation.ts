import { z } from 'zod';

const ttlSchema = z.union([
  z.coerce.number().int().positive(),
  z.string().regex(/^\d+(ms|s|m|h|d)?$/i),
]);

export const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  CORS_ORIGIN: z.string().default(''),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_EXPIRES: ttlSchema.default('15m'),
  JWT_REFRESH_EXPIRES: ttlSchema.default('7d'),

  STORAGE_BUCKET: z.string().optional(),
  GCS_BUCKET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
});

export type EnvVars = z.infer<typeof envSchema>;
