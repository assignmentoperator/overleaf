FROM node:18-bullseye

# Install dependencies
RUN apt-get update && \
    apt-get install -y git curl python3 build-essential libkrb5-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /overleaf

# Clone Overleaf Community Edition
RUN git clone https://github.com/overleaf/overleaf.git .

# Install Overleaf dependencies
RUN npm install

# Port
ENV PORT=3000
EXPOSE 3000

# Use built-in MongoDB and Redis (for demo purposes only)
ENV ENABLED_SERVICES=overleaf
ENV MONGO_URL=mongodb://localhost:27017/overleaf
ENV REDIS_URL=redis://localhost:6379

# Add internal MongoDB and Redis services (not production-grade)
RUN apt-get update && apt-get install -y mongodb redis-server

# Start Overleaf with services
CMD service mongodb start && \
    service redis-server start && \
    npm start
