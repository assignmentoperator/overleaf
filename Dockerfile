FROM node:18-bullseye

# Install OS dependencies
RUN apt-get update && \
    apt-get install -y git curl python3 build-essential libkrb5-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Clone Overleaf (this will include launch.js and everything needed)
WORKDIR /overleaf
RUN git clone https://github.com/overleaf/overleaf.git . 

# Install dependencies
RUN npm install

# Copy the start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose Overleaf's port
EXPOSE 3000

# Start Overleaf
CMD ["/start.sh"]
