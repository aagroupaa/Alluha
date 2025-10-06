# Multi-container setup for Allura Forum (Node + Postgres)
FROM node:18-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production=false --no-audit --no-fund

# Copy app source
COPY . .

# Expose app port
EXPOSE 3000

# Default command
CMD ["npm", "start"]
