# Docker Deployment Guide

## Overview
This document provides instructions for deploying Vibe LMS using Docker containers.

## Recent Fixes Applied

### Production Build Issues Resolved
- **Issue**: TypeScript path resolution errors in production (`ERR_INVALID_ARG_TYPE`)
- **Root Cause**: `import.meta.dirname` undefined in Docker environment
- **Solution**: Direct TypeScript execution using `tsx` instead of compiled JavaScript

### Docker Configuration Updates
- Created production-specific server entry point (`index.prod.ts`)
- Eliminated vite.config.ts dependency in production mode
- Added `tsx` as production dependency for TypeScript runtime
- Removed problematic `import.meta.dirname` path resolution
- Set proper environment variables for production mode

## Prerequisites
- Docker and Docker Compose installed
- Environment variables configured in `.env` file
- Database URL configured for PostgreSQL

## Deployment Steps

### 1. Environment Setup
The repository includes a `.env` file with secure defaults for Docker deployment:
```env
POSTGRES_PASSWORD=vibelms_secure_password_2024
SESSION_SECRET=vibelms_jwt_secret_key_minimum_32_characters_long_secure_random_string
```

**Important**: Change these values for production deployment:
- Generate a strong `POSTGRES_PASSWORD` 
- Create a secure 32+ character `SESSION_SECRET`

### 2. Deploy Application
```bash
# Stop any running containers
docker compose down

# Build and start containers
docker compose up -d --build

# Check container status
docker compose ps

# View logs
docker compose logs -f app
```

### 3. Verify Deployment
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test application access
curl http://localhost:5000
```

## Docker Configuration Details

### Dockerfile Changes
- Uses `tsx` for direct TypeScript execution in production
- Includes vite and tsx as production dependencies
- Copies all necessary TypeScript configuration files
- Sets NODE_ENV=production environment variable

### Multi-Stage Build
1. **Builder Stage**: Builds frontend assets using Vite
2. **Production Stage**: Sets up Node.js runtime with TypeScript support

## Troubleshooting

### Container Won't Start
- Check Docker logs: `docker compose logs app`
- Verify `.env` file exists with required variables
- Ensure PostgreSQL container is healthy: `docker compose logs postgres`

### Database Connection Issues
- The Docker setup includes a PostgreSQL container that starts automatically
- Database connection errors usually indicate missing `.env` file
- Check PostgreSQL container health: `docker compose ps`
- Verify network connectivity: `docker compose logs postgres`

### Authentication Issues
- Ensure SESSION_SECRET is set in `.env` file
- SESSION_SECRET must be at least 32 characters long
- Check that cookies are being set properly in browser dev tools

## Health Monitoring
The application includes a health check endpoint at `/api/health` that verifies:
- Server responsiveness
- Database connectivity
- Basic application functionality

## Production Considerations
- Use environment-specific database URLs
- Configure proper logging levels
- Set up SSL/TLS termination
- Implement proper backup strategies
- Monitor container resource usage

## Development vs Production
- Development: Uses `tsx` with hot reload
- Production: Uses `tsx` with compiled frontend assets
- Both modes support full TypeScript execution without compilation