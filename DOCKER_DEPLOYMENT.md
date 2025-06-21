# Docker Deployment Guide

## Overview
This document provides instructions for deploying Vibe LMS using Docker containers.

## Recent Fixes Applied

### Production Build Issues Resolved
- **Issue**: TypeScript path resolution errors in production (`ERR_INVALID_ARG_TYPE`)
- **Root Cause**: `import.meta.dirname` undefined in Docker environment
- **Solution**: Direct TypeScript execution using `tsx` instead of compiled JavaScript

### Docker Configuration Updates
- Switched from esbuild compilation to direct TypeScript execution
- Added `tsx` as production dependency for TypeScript runtime
- Included all necessary configuration files (tsconfig.json, vite.config.ts)
- Set proper environment variables for production mode

## Prerequisites
- Docker and Docker Compose installed
- Environment variables configured in `.env` file
- Database URL configured for PostgreSQL

## Deployment Steps

### 1. Environment Setup
Create a `.env` file with:
```env
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret_key
```

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
- Verify environment variables are set
- Ensure database is accessible

### Path Resolution Errors
- Verify tsconfig.json is copied to container
- Check that tsx is installed in production dependencies

### Database Connection Issues
- Verify DATABASE_URL format
- Check network connectivity to database
- Ensure database accepts connections from Docker network

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