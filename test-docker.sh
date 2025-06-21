#!/bin/bash

echo "Testing Docker deployment..."

# Stop any running containers
docker compose down

# Build and start containers
echo "Building containers..."
docker compose up -d --build

# Wait for containers to start
echo "Waiting for containers to start..."
sleep 10

# Check if containers are running
echo "Checking container status..."
docker compose ps

# Test health endpoint
echo "Testing health endpoint..."
curl -f http://localhost:5000/api/health || echo "Health check failed"

# Check logs
echo "Container logs:"
docker compose logs app

echo "Docker test complete."