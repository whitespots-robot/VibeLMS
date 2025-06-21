# Vibe LMS - Learning Management System

A modern Learning Management System with hierarchical course structure, YouTube video integration, and comprehensive progress tracking for both authenticated and anonymous users.

## Features

- 🎯 Hierarchical structure: Course → Chapter → Lesson
- 📹 YouTube video integration with embedded player
- 📝 Rich text content with TipTap editor
- 🖼️ Image and code example support
- ❓ Interactive questions and assignments
- 📊 Individual progress tracking per user session
- 👤 Anonymous user support with session continuity
- 📁 File upload and materials management system
- 📦 Course export to ZIP archives
- 🔒 JWT-based authentication with secure HTTP-only cookies
- 👥 Role-based access control (Teachers/Instructors, Students)
- 🌐 Public course preview without registration
- 📱 Responsive mobile-first design
- 🎉 Course completion celebrations

## Technologies

- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/ui components
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens with HTTP-only cookies
- **State Management**: TanStack Query (React Query)
- **Rich Text**: TipTap editor
- **Build Tools**: Vite
- **Containerization**: Docker with multi-stage builds

## Installation and Setup

### Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with environment variables (see "Environment Variables" section)
4. Start the application:
   ```bash
   npm run dev
   ```

### Production with Docker

1. Create a `.env` file with environment variables
2. Start with Docker Compose:
   ```bash
   docker-compose up -d
   ```

The application will be available on port 80.

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# PostgreSQL database password (REQUIRED)
POSTGRES_PASSWORD=your_secure_password_here

# JWT session secret (REQUIRED for production)
SESSION_SECRET=your_jwt_secret_key_here

# Additional variables for development (optional)
DATABASE_URL=postgresql://username:password@localhost:5432/vibelms
PGHOST=localhost
PGPORT=5432
PGUSER=username
PGPASSWORD=password
PGDATABASE=vibelms
```

### Required Variables

- `POSTGRES_PASSWORD` - PostgreSQL database password. Use a strong password for security.
- `SESSION_SECRET` - Secret key for JWT token signing. Generate a random string (32+ characters).

### Development Variables

If you're using a local database for development, add:

- `DATABASE_URL` - Full PostgreSQL connection string
- `PGHOST` - Database host (usually localhost)
- `PGPORT` - Database port (usually 5432)
- `PGUSER` - Database username
- `PGPASSWORD` - Database user password
- `PGDATABASE` - Database name

## Project Structure

```
├── client/               # Frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Application pages
│   │   ├── hooks/        # Custom hooks
│   │   └── lib/          # Utilities and configurations
├── server/               # Backend application
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data access layer
│   └── db.ts             # Database configuration
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schemas
├── uploads/              # Uploaded files
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose configuration
└── init-db.sql          # Database initialization script
```

## Database

The application uses PostgreSQL with automatic migrations through Drizzle ORM. When running in Docker, the database structure is created automatically.

### Database Commands

```bash
# Apply schema changes to the database
npm run db:push

# Open Drizzle Studio for data viewing
npm run db:studio
```

## API Endpoints

### Public Routes (No authentication required)
- `GET /api/public/courses` - List public courses
- `GET /api/public/courses/:id` - Get public course details
- `GET /api/public/lessons/:id/details` - Get lesson content for preview
- `GET /api/settings/allow_student_registration` - Check registration settings

### Authentication Routes
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user info

### Protected Routes (Authentication required)
- `GET /api/courses` - User's courses
- `GET /api/courses/:id` - Course details
- `GET /api/courses/:id/progress` - User's progress in course
- `POST /api/progress` - Update lesson progress
- `GET /api/enrollments` - User's enrollments
- `POST /api/enrollments` - Enroll in course
- `GET /api/materials` - Course materials
- `POST /api/materials` - Upload material

### Admin Routes (Teacher/Instructor only)
- `GET /api/users` - Manage users
- `DELETE /api/users/bulk` - Delete multiple users
- `GET /api/dashboard/stats` - System statistics

## User Roles

- **Instructor/Teacher** - Full course management, user administration, analytics access
- **Student** - Course enrollment, progress tracking, material access
- **Anonymous** - Public course preview, automatic session-based progress tracking

## Security Features

- JWT-based authentication with HTTP-only cookies
- Automatic CSRF protection through SameSite cookie policy
- File path validation prevents directory traversal attacks
- Filename sanitization on upload
- Role-based access control for API endpoints
- Secure password hashing with bcrypt
- Session-based anonymous user tracking

## Deployment

### Docker Production Deployment

1. Clone the repository and create your `.env` file:
   ```bash
   cp .env.example .env
   # Edit .env with your secure passwords and secrets
   ```

2. Generate secure secrets:
   ```bash
   # Generate a secure PostgreSQL password
   openssl rand -base64 32

   # Generate a secure JWT session secret
   openssl rand -base64 64
   ```

3. Start the application:
   ```bash
   docker-compose up -d
   ```

4. Check application status:
   ```bash
   docker-compose logs -f app
   docker-compose ps
   ```

The application will be available at `http://localhost` (port 80).

### Health Monitoring

The application includes built-in health checks:
- Docker health check endpoint: `GET /api/health`
- Automatic container restart on failure
- Database connection monitoring

### Scaling and Performance

For production environments:
- Use a reverse proxy (nginx) for SSL termination
- Configure PostgreSQL with appropriate connection pooling
- Monitor JWT session token expiration (7 days default)
- Scale horizontally using Docker Swarm or Kubernetes

## Support

For support, please create an issue in the project repository.

## License

MIT License