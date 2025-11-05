export const appConfig = () => ({
    port: parseInt(process.env.PORT ?? '4000', 10),
    corsOrigins: (process.env.CORS_ORIGIN ?? '').split(',').map(s => s.trim()).filter(Boolean),
    mongoUri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/portal',
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access',
        accessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
        refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh',
        refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
    },
    cookies: {
        enabled: (process.env.USE_COOKIES ?? 'true').toLowerCase() === 'true',
        atName: process.env.COOKIE_NAME_AT ?? 'at',
        rtName: process.env.COOKIE_NAME_RT ?? 'rt',
        domain: process.env.COOKIE_DOMAIN, // omit in dev to create host-only cookie
        secure: (process.env.COOKIE_SECURE ?? 'true').toLowerCase() === 'true',
        sameSite: (process.env.COOKIE_SAMESITE ?? 'none').toLowerCase() as
            | 'lax' | 'strict' | 'none',
        path: process.env.COOKIE_PATH ?? '/',
    },
    csrf: {
        cookieName: process.env.CSRF_COOKIE_NAME ?? 'csrfToken',
    },
});
