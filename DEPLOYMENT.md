# Docker Deployment Guide for Vibe LMS

## Fixed Issues

1. **Build Dependencies**: Fixed Dockerfile to install all dependencies (including dev dependencies) needed for the build process
2. **Docker Compose Version**: Removed obsolete `version` attribute to eliminate warnings
3. **Health Check**: Added `/api/health` endpoint for container monitoring

## Quick Deployment

1. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Generate secure secrets**:
   ```bash
   # PostgreSQL password
   echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)" >> .env
   
   # JWT session secret
   echo "SESSION_SECRET=$(openssl rand -base64 64)" >> .env
   ```

3. **Deploy**:
   ```bash
   docker compose up -d
   ```

4. **Check status**:
   ```bash
   docker compose ps
   docker compose logs -f app
   ```

## Manual Environment Setup

Edit your `.env` file:

```env
# Required: PostgreSQL password (use a strong password)
POSTGRES_PASSWORD=your_secure_password_here

# Required: JWT session secret (32+ characters)
SESSION_SECRET=your_jwt_secret_key_minimum_32_characters_long
```

## Verification

- Application: http://localhost
- Health check: http://localhost/api/health
- Database logs: `docker compose logs postgres`
- App logs: `docker compose logs app`

## Troubleshooting

**Build fails**: Ensure you have the latest Docker version and sufficient disk space.

**Container won't start**: Check logs with `docker compose logs app` and verify your `.env` file has all required variables.

**Database connection issues**: Wait for PostgreSQL to fully initialize (check with `docker compose logs postgres`).

## Production Considerations

- Use a reverse proxy (nginx) for SSL
- Set up automated backups for PostgreSQL data
- Monitor container health and resource usage
- Keep JWT session secrets secure and rotate periodically