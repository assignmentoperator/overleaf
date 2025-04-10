#!/bin/bash

# Print the URLs
echo "Starting Overleaf..."
echo "Using MongoDB URL: $MONGO_URL"
echo "Using Redis URL: $REDIS_URL"

# Start Overleaf
npm start
