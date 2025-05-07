# Use Node.js LTS version
FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# Copy package.json and package-lock.json
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Create directories for SQLite database and WhatsApp auth
RUN mkdir -p /usr/src/app/auth_info

# Expose port
EXPOSE 3000

# Start the application
CMD [ "npm", "start" ]
