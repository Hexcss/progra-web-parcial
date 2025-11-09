import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  CORS_ORIGIN: z.string().default(''),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  DISCORD_SUPPORT_WEBHOOK_URL: z.string().min(1, 'DISCORD WEBHOOK is required'),
});

export type EnvVars = z.infer<typeof envSchema>;
