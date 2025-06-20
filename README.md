# Vibe LMS - Learning Management System

A modern Learning Management System with hierarchical course structure, YouTube video support, rich text content, and student progress tracking.

## Features

- 🎯 Hierarchical structure: Course → Chapter → Lesson
- 📹 YouTube video integration
- 📝 Rich text editor with formatting
- 🖼️ Image and code example support
- ❓ Interactive questions and assignments
- 📊 Student progress tracking
- 📁 File upload and materials system
- 📦 Course export to ZIP archives
- 🔒 Authentication with teacher and student roles
- 🌐 Public courses without registration

## Technologies

- **Frontend**: React 18, Tailwind CSS, Shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Passport.js
- **Build**: Vite

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

Main API routes:

- `GET /api/public/courses` - Public courses
- `GET /api/courses` - Courses (requires authentication)
- `GET /api/courses/:id/chapters` - Course chapters
- `GET /api/lessons/:id` - Lesson with details
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registration
- `GET /api/materials` - Course materials
- `GET /api/materials/:id/download` - Download material

## User Roles

- **Administrator** - Full system access
- **Teacher** - Course creation and management
- **Student** - Course viewing and progress tracking

## Security

- File path validation prevents directory traversal attacks
- Filename sanitization on upload
- Session-based authentication
- Password hashing
- Protected API endpoints

## Support

For support, please create an issue in the project repository.

## License

MIT License