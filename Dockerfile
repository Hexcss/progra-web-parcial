########################################
# 0) Base dependencies
########################################
FROM node:23-slim AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

########################################
# 1) Install dependencies (with cache)
########################################
FROM base AS deps

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

########################################
# 2) Build the app with API_URL ARG
########################################
FROM base AS builder

ARG API_URL
ENV VITE_API_URL=${API_URL}
ENV VITE_SUPPORT_WS_URL=${WS_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

########################################
# 3) Production Nginx static server
########################################
FROM nginx:stable-alpine AS runner

ARG API_URL
ENV API_URL=${API_URL}

# Remove default nginx site
RUN rm /etc/nginx/conf.d/default.conf

# Custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy static build output
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
