# Base image
FROM node:20-alpine AS builder

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy app source
COPY . .

# Generate Prisma client and build typescript
RUN npx prisma generate
RUN npm run build

# Production image
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# Copy built assets and dependencies from builder
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

# Expose port and start application
EXPOSE 5000
CMD [ "npm", "start" ]
