FROM node:18-bullseye

# Install dependencies
RUN apt-get update && \
    apt-get install -y git curl python3 build-essential libkrb5-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /overleaf

# Clone Overleaf source
RUN git clone https://github.com/overleaf/overleaf.git .

# Install dependencies
RUN npm install

# Copy the start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose Overleaf default port
EXPOSE 3000

CMD ["/start.sh"]
