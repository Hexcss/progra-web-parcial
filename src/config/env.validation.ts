import { z } from 'zod';

// Accept either a positive integer (seconds) or "<int><unit>"
// where unit ∈ ms|s|m|h|d (e.g., "900s", "15m", "7d")
const ttlSchema = z.union([
  z.coerce.number().int().positive(),
  z.string().regex(/^\d+(ms|s|m|h|d)?$/i),
]);

export const envSchema = z.object({
  // Runtime
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // CORS
  // Comma-separated list of allowed origins (e.g., "https://app.example.com,https://admin.example.com")
  CORS_ORIGIN: z.string().default(''),

  // Database
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  // JWT (cookies)
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_EXPIRES: ttlSchema.default('15m'),
  JWT_REFRESH_EXPIRES: ttlSchema.default('7d'),

  // Cookies (cross-site ready)
  USE_COOKIES: z.coerce.boolean().default(true),
  COOKIE_NAME_AT: z.string().default('at'),
  COOKIE_NAME_RT: z.string().default('rt'),
  // Optional in dev to create host-only cookies; set to API domain in prod (e.g., "api.example.com")
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z.coerce.boolean().default(true),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('none'),
  COOKIE_PATH: z.string().default('/'),

  // CSRF
  CSRF_COOKIE_NAME: z.string().default('csrfToken'),
});

export type EnvVars = z.infer<typeof envSchema>;
