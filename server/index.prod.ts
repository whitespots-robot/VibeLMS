import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./vite.prod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Wait for database to be ready
async function waitForDatabase(maxRetries = 30, delay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await execAsync("npm run db:push");
      log("Database connection established successfully");
      return;
    } catch (error) {
      log(`Database connection attempt ${i + 1}/${maxRetries} failed, retrying in ${delay/1000}s...`);
      if (i === maxRetries - 1) {
        throw new Error(`Failed to connect to database after ${maxRetries} attempts`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}



// Force ensure demo data exists every time
async function ensureDemoData() {
  try {
    log("Ensuring demo data exists...");
    const { pool } = await import("./db");
    
    // Always check and create if missing
    const teacherCheck = await pool.query("SELECT id FROM users WHERE username = 'teacher' LIMIT 1");
    let teacherId;
    
    if (teacherCheck.rows.length === 0) {
      log("Creating teacher user...");
      const teacherResult = await pool.query(`
        INSERT INTO users (username, password, email, role, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id
      `, ['teacher', '78509d9eaba5a4677c412ec1a06ba37cd8a315386903cb5265fe7ed677c3106a2eef1d7d5e18c34bb4390ab300aa8ebceaae8fd9ed4e14657647816910e17044', 'teacher@example.com', 'instructor']);
      teacherId = teacherResult.rows[0].id;
      log("Teacher user created");
    } else {
      teacherId = teacherCheck.rows[0].id;
      log("Teacher user exists");
    }
    
    // Always check and create course if missing
    const courseCheck = await pool.query("SELECT id FROM courses WHERE title = '🎯 Complete Web Development Bootcamp' LIMIT 1");
    
    if (courseCheck.rows.length === 0) {
      log("Creating demo course...");
      const courseResult = await pool.query(`
        INSERT INTO courses (title, description, instructor_id, status, is_public, allow_registration, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id
      `, ['🎯 Complete Web Development Bootcamp', 'Master web development from scratch! Learn HTML, CSS, JavaScript, and build real projects. Perfect for beginners who want to become professional web developers.', teacherId, 'published', true, true]);
      
      const courseId = courseResult.rows[0].id;
      log(`Demo course created with ID: ${courseId}`);
      
      // Create basic chapter and lesson
      const chapterResult = await pool.query(`
        INSERT INTO chapters (title, description, course_id, order_index, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id
      `, ['Getting Started', 'Introduction to web development', courseId, 1]);
      
      await pool.query(`
        INSERT INTO lessons (title, description, content, chapter_id, order_index, lesson_type, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, ['Welcome', 'Welcome to the course!', '<h2>Welcome!</h2><p>Let\'s start learning web development.</p>', chapterResult.rows[0].id, 1, 'text']);
      
      log("Demo chapter and lesson created");
    } else {
      log("Demo course already exists");
    }
    
    // Always ensure system settings
    await pool.query(`
      INSERT INTO system_settings (key, value)
      VALUES 
        ('allow_student_registration', 'true'),
        ('platform_name', 'Vibe LMS'),
        ('welcome_message', 'Welcome to your learning journey!')
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `);
    
    // Final verification
    const finalCheck = await pool.query("SELECT COUNT(*) as count FROM courses WHERE is_public = true AND status = 'published'");
    log(`Final check: ${finalCheck.rows[0].count} public courses available`);
    
  } catch (error) {
    log(`Demo data error: ${error}`, "demo");
  }
}

// Run database migrations on startup
async function runMigrations() {
  try {
    log("Waiting for database to be ready...");
    await waitForDatabase();
    log("Running database migrations...");
    await execAsync("npm run db:push");
    log("Database migrations completed successfully");
    
    // Always ensure demo data after migrations
    await ensureDemoData();
    
  } catch (error) {
    log(`Migration error: ${error}`, "migration");
    // Don't exit on migration errors in production - database might already be set up
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
  }
}

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const colorCodes = {
    GET: "\x1b[32m",    // Green
    POST: "\x1b[33m",   // Yellow
    PUT: "\x1b[34m",    // Blue
    DELETE: "\x1b[31m", // Red
    PATCH: "\x1b[35m",  // Magenta
    HEAD: "\x1b[36m",   // Cyan
    OPTIONS: "\x1b[37m", // White
  };

  const methodColor = colorCodes[req.method as keyof typeof colorCodes] || "\x1b[0m";
  const resetColor = "\x1b[0m";

  const originalSend = res.json;
  res.json = function (data) {
    let logData = "";
    if (data) {
      if (typeof data === "string") {
        logData = data.slice(0, 80);
      } else {
        logData = JSON.stringify(data).slice(0, 80);
      }

      let logLine = `${methodColor}${req.method}${resetColor} ${req.path} ${res.statusCode} in ${Date.now() - res.locals.startTime}ms :: ${logData}`;
      
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
    
    return originalSend.call(this, data);
  };

  res.locals.startTime = Date.now();
  next();
});

(async () => {
  // Run database migrations first
  await runMigrations();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Only serve static files in production
  serveStatic(app);

  const PORT = parseInt(process.env.PORT || "5000", 10);
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();