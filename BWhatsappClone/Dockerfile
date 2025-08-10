# Use official Node.js LTS image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files and install dependencies first (use cache efficiently)
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Expose port your app uses
EXPOSE 5000

# Default command to run your app
CMD ["node", "server.js"]
