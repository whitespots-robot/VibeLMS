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
- **Username**: teacher
- **Password**: teacher
- **Role**: instructor

### User Management Commands

#### Creating Users via Database
Connect to the database and create users directly:

```bash
# Connect to database container
docker compose exec postgres psql -U vibelms -d vibelms

# Create instructor user
INSERT INTO users (username, password, email, role, created_at)
VALUES (
  'your_username',
  '78509d9eaba5a4677c412ec1a06ba37cd8a315386903cb5265fe7ed677c3106a2eef1d7d5e18c34bb4390ab300aa8ebceaae8fd9ed4e14657647816910e17044',
  'your_email@example.com',
  'instructor',
  NOW()
);

# Create student user
INSERT INTO users (username, password, email, role, created_at)
VALUES (
  'student_username',
  '78509d9eaba5a4677c412ec1a06ba37cd8a315386903cb5265fe7ed677c3106a2eef1d7d5e18c34bb4390ab300aa8ebceaae8fd9ed4e14657647816910e17044',
  'student@example.com',
  'student',
  NOW()
);
```

**Note**: The password hash above corresponds to "teacher" - replace with your own hashed password.

#### Password Hashing
To generate a password hash for a new user:

```bash
# Generate password hash using Node.js
docker compose exec app node -e "
const crypto = require('crypto');
const password = 'your_new_password';
const salt = 'vibelms_salt_2024';
const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
console.log('Password hash:', hash);
"
```

#### Creating Users via API
You can also create users through the registration endpoint:

```bash
# Create new user via API
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password",
    "email": "your_email@example.com"
  }'
```

**Note**: New users created via API have "student" role by default. To create instructors, use the database method above.

#### Quick User Creation Examples

```bash
# Example 1: Create instructor "admin" with password "admin123"
docker compose exec postgres psql -U vibelms -d vibelms -c "
INSERT INTO users (username, password, email, role, created_at)
VALUES (
  'admin',
  '$(docker compose exec app node -e "
const crypto = require('crypto');
console.log(crypto.pbkdf2Sync('admin123', 'vibelms_salt_2024', 10000, 64, 'sha512').toString('hex'));
" | tr -d '\n\r')',
  'admin@yourdomain.com',
  'instructor',
  NOW()
);"

# Example 2: Create student "john" with password "password123"
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "password": "password123", 
    "email": "john@yourdomain.com"
  }'
```

#### User Roles
- **instructor**: Can create and manage courses, view analytics
- **student**: Can enroll in courses and track progress

#### Checking Existing Users
```bash
# List all users
docker compose exec postgres psql -U vibelms -d vibelms -c "SELECT id, username, email, role, created_at FROM users ORDER BY created_at;"

# Check specific user
docker compose exec postgres psql -U vibelms -d vibelms -c "SELECT * FROM users WHERE username = 'your_username';"
```

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