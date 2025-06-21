# Vibe LMS Deployment Guide

## Docker Deployment (Recommended)

### Quick Start
```bash
# Clone the repository and navigate to project directory
git clone <your-repo-url>
cd vibe-lms

# Start the application
docker compose up -d --build

# Check status
docker compose ps
```

### Environment Configuration
The `.env` file is included with secure defaults:
```env
POSTGRES_PASSWORD=VibelmsSecurePass2024
SESSION_SECRET=vibelms_jwt_secret_key_minimum_32_characters_long_secure_random_string
```

**Production Security**: Update these values before deployment:
- Use a strong database password (alphanumeric only, avoid `/`, `@`, `:`)
- Generate a random 32+ character session secret

### Application Access
- **Application**: http://localhost (port 80)
- **Health Check**: http://localhost/api/health

### Default Login Credentials
Demo data is created automatically on first startup:
- **Username**: admin
- **Password**: admin123
- **Role**: instructor

### Demo Course
The system includes a complete demo course:
- **Title**: "Complete Web Development Bootcamp"
- **Content**: HTML, CSS, JavaScript lessons with videos and quizzes
- **Features**: Student enrollment, progress tracking, materials

### Architecture
- **Frontend**: React with Vite build system
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL 15 with automatic initialization
- **Authentication**: JWT with secure HTTP-only cookies

### Container Services
1. **app**: Main application server (Node.js + TypeScript) with database connection retry logic
2. **postgres**: PostgreSQL database with enhanced health checks (5s intervals, 60s startup time)

### Troubleshooting

#### Container Issues
```bash
# View all logs
docker compose logs

# View specific service logs
docker compose logs app
docker compose logs postgres

# Check container status
docker compose ps

# Restart services
docker compose restart
```

#### Database Connection Errors
- Verify `.env` file exists with valid `POSTGRES_PASSWORD`
- Ensure password contains only URL-safe characters
- Check PostgreSQL container health: `docker compose ps`

#### Authentication Problems
- Verify `SESSION_SECRET` is at least 32 characters
- Clear browser cookies and retry
- Check browser developer tools for cookie issues

## Manual Development Setup

### Prerequisites
- Node.js 18+ with npm
- PostgreSQL database
- Environment variables configured

### Installation
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### Production Build
```bash
# Build frontend assets
npm run build

# Start production server
npm start
```

## Production Considerations

### Security
- Use strong, unique passwords for database and session secret
- Enable HTTPS/TLS termination (reverse proxy recommended)
- Configure proper firewall rules
- Regular security updates for base images

### Performance
- Monitor container resource usage
- Configure database connection pooling
- Implement CDN for static assets
- Set up proper logging and monitoring

### Backup Strategy
- Regular PostgreSQL database backups
- Backup uploaded files volume (`./uploads`)
- Store backups securely offsite

### Scaling
- Use container orchestration (Kubernetes, Docker Swarm)
- Implement load balancing for multiple app instances
- Consider database clustering for high availability
- Monitor performance metrics and scale accordingly

## Support
For deployment issues, check logs first and verify environment configuration. The application includes comprehensive error handling and logging to help diagnose problems.