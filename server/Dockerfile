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

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001
ENV WS_PORT=3001
ENV USE_SSL=false
ENV CORS_ORIGIN=*

# Switch to non-root user
USER node

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"] 