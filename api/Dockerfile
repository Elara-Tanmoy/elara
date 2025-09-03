# api/Dockerfile
FROM node:18-alpine

# Add curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Copy manifest first (better layer caching)
COPY package.json package-lock.json* ./

# Install deps (prod only)
RUN npm ci --omit=dev

# Copy source
COPY . .

# Security: drop root
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

# App Service will pass PORT; default to 3001 for local
ENV PORT=3001 NODE_ENV=production
EXPOSE 3001

# Simple healthcheck (App Service probes separately; this helps local runs)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:${PORT}/health || exit 1

CMD ["node","server.js"]
