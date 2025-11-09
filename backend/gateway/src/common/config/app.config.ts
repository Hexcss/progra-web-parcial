export const appConfig = () => ({
    port: parseInt(process.env.PORT ?? '4000', 10),
    corsOrigins: (process.env.CORS_ORIGIN ?? '').split(',').map(s => s.trim()).filter(Boolean),
    mongoUri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/portal',
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access',
        refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh',
    },
    supportWebhook: process.env.DISCORD_SUPPORT_WEBHOOK_URL ?? ''
});
