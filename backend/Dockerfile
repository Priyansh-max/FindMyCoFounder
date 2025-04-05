# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json first (to cache dependencies)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy remaining backend files
COPY . .

# Expose the backend port
EXPOSE 5000

# Start the backend
CMD ["node", "index.js"]
