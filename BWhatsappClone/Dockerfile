# Use official Node image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies first
COPY package*.json ./
RUN npm install

# Copy all project files
COPY . .

# Expose port your app listens on
EXPOSE 5000

# Run your app when container starts
CMD ["node", "server.js"]
