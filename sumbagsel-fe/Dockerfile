# Build stage
FROM node:20-alpine AS builder

ARG NODE_ENV=production
ARG NEXT_PUBLIC_API_URL

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set build-time environment variables
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package files
COPY package*.json ./

# Copy standalone output from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

# Set environment variable for runtime
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]

