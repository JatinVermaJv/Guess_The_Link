# Use Node.js LTS version
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Create directory for SSL certificates
RUN mkdir -p /usr/src/app/ssl

# Expose the port the app runs on
EXPOSE 3001

# Start the application
CMD ["npm", "start"] 