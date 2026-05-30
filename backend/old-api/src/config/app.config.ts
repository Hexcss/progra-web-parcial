// src/config/app.config.ts
export const appConfig = () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  corsOrigins: (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  clientUrl:
    ((process.env.CORS_ORIGIN ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)[0]) || 'http://localhost:5173',
  mongoUri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/portal',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access',
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
  },
  oauth: {
    google: {
      clientId: process.env.OAUTH_GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET ?? '',
      redirectUri: process.env.OAUTH_GOOGLE_REDIRECT_URI ?? '',
    },
    github: {
      clientId: process.env.OAUTH_GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.OAUTH_GITHUB_CLIENT_SECRET ?? '',
      redirectUri: process.env.OAUTH_GITHUB_REDIRECT_URI ?? '',
    },
  },
});

export type AppConfig = ReturnType<typeof appConfig>;
