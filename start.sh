#!/bin/bash

echo "Starting Overleaf..."

# Ensure PORT is set (Railway will provide it, fallback to 3000)
export PORT=${PORT:-3000}

# Print the config for debugging
echo "Using PORT: $PORT"
echo "Using MongoDB URL: $MONGO_URL"
echo "Using Redis URL: $REDIS_URL"

# Start Overleaf using the correct script
node launch.js
