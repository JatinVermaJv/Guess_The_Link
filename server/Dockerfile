# Use Node.js LTS version
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Bundle app source
COPY . .

# Create directory for SSL certificates
RUN mkdir -p /usr/src/app/ssl

# Expose the port the app runs on
EXPOSE 3001

# Start the application
CMD ["npm", "start"] 