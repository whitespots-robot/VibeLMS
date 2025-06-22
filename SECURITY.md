
# Highly important information about security issues

1. This project was created with a huge help of AI (It definately could have some security issues)
2. There are checks performed by whitespots security portal and many open source scanners under the hood.
You may find merge requests with comments about discovered issues
3. It's allowed only for administrators to add other administrators (no open registration for instructors)
4. There's a feature to stop students registration
5. Anonymous users are still users. If they watch something - it's tracked
6. There's an editor for instructors, which allows them to put any code they want - there's a place for self-XSS and such vulnerabilities

## Current Security Implementation Details

### Authentication System
- Uses JWT tokens stored in httpOnly cookies
- Anonymous sessions generated for non-authenticated users
- Session upgrade mechanism when users log in
- Password hashing with bcrypt (10 salt rounds)
- Session middleware validates tokens on protected routes

### Database Security
- PostgreSQL with Drizzle ORM prevents SQL injection
- All queries use parameterized statements
- Connection pooling configured for production
- Database migrations handled through Drizzle

### File Upload Security
- File uploads restricted to /uploads directory
- Filename sanitization prevents path traversal
- File type validation on backend
- Size limits enforced (configurable per endpoint)

### API Security
- Input validation using Zod schemas on all endpoints
- Role-based middleware: requireAuth, requireRole
- CORS configured for development/production environments
- Request body size limits configured

### Known Security Concerns
- Rich text editor allows HTML/JavaScript input from instructors
- No rate limiting implemented (recommended for production)
- File uploads don't scan for malware
- No CSRF protection tokens
- Database connections in development don't use SSL
- Error messages may leak sensitive information in logs

### Current User Roles & Permissions
- **admin**: Full system access, can manage users, courses, settings
- **instructor**: Can create/edit courses and lessons, upload materials
- **student**: Can view enrolled courses, track progress
- **anonymous**: Can view public courses, progress tracked by session

### Environment-Specific Security
- Development: Relaxed CORS, detailed error logging
- Production: Should use HTTPS, secure cookies, SSL database connections
- Database URL and JWT secret stored in environment variables

### Monitoring & Logging
- Request logging includes method, path, status, response time
- Authentication attempts logged
- File upload activities tracked
- No sensitive data (passwords, tokens) logged in plain text
