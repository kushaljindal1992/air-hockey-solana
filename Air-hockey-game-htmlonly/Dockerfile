# Use official Node.js runtime
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port (Cloud Run will override with PORT env variable)
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production

# Start the server
CMD ["node", "server.js"]
