# Use Node.js LTS version
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Create directory for SSL certificates
RUN mkdir -p /usr/src/app/ssl

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"] 