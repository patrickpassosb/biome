# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Enable legacy peer deps if needed, but standard npm install should work
COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copy built artifacts and dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

# Next.js usually runs on 3000 by default unless configured otherwise
CMD ["npm", "start"]