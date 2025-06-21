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



// Run database migrations on startup
async function runMigrations() {
  try {
    log("Waiting for database to be ready...");
    await waitForDatabase();
    log("Running database migrations...");
    await execAsync("npm run db:push");
    log("Database migrations completed successfully");
    
    // Run initial data migration using direct database connection
    log("Running initial data migration...");
    try {
      const { pool } = await import("./db");
      
      // Check if teacher user exists
      const teacherCheck = await pool.query("SELECT id FROM users WHERE username = 'teacher' LIMIT 1");
      
      if (teacherCheck.rows.length === 0) {
        log("Teacher user not found, creating demo data...");
        
        // Create teacher user
        await pool.query(`
          INSERT INTO users (username, password, email, role, created_at)
          VALUES ($1, $2, $3, $4, NOW())
        `, ['teacher', '78509d9eaba5a4677c412ec1a06ba37cd8a315386903cb5265fe7ed677c3106a2eef1d7d5e18c34bb4390ab300aa8ebceaae8fd9ed4e14657647816910e17044', 'teacher@example.com', 'instructor']);
        
        log("Teacher user created successfully");
        
        // Get teacher ID
        const teacherResult = await pool.query("SELECT id FROM users WHERE username = 'teacher' LIMIT 1");
        const teacherId = teacherResult.rows[0].id;
        
        // Create demo course
        const courseResult = await pool.query(`
          INSERT INTO courses (title, description, instructor_id, status, is_public, allow_registration, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          RETURNING id
        `, ['🎯 Complete Web Development Bootcamp', 'Master web development from scratch! Learn HTML, CSS, JavaScript, and build real projects. Perfect for beginners who want to become professional web developers.', teacherId, 'published', true, true]);
        
        const courseId = courseResult.rows[0].id;
        log("Demo course created successfully");
        
        // Create demo chapters
        const chapter1Result = await pool.query(`
          INSERT INTO chapters (title, description, course_id, order_index, created_at)
          VALUES ($1, $2, $3, $4, NOW())
          RETURNING id
        `, ['Getting Started with Web Development', 'Introduction to web development fundamentals and setting up your development environment.', courseId, 1]);
        
        const chapter2Result = await pool.query(`
          INSERT INTO chapters (title, description, course_id, order_index, created_at)
          VALUES ($1, $2, $3, $4, NOW())
          RETURNING id
        `, ['HTML Fundamentals', 'Learn the building blocks of web pages with HTML5.', courseId, 2]);
        
        log("Demo chapters created successfully");
        
        // Create demo lessons
        await pool.query(`
          INSERT INTO lessons (title, description, content, chapter_id, order_index, lesson_type, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, ['Welcome to Web Development', 'Your journey into web development starts here!', '<h2>Welcome to Web Development!</h2><p>In this course, you\'ll learn everything you need to become a professional web developer.</p><p><strong>What you\'ll learn:</strong></p><ul><li>HTML5 fundamentals</li><li>CSS3 styling and layouts</li><li>JavaScript programming</li><li>Building real projects</li></ul>', chapter1Result.rows[0].id, 1, 'text']);
        
        await pool.query(`
          INSERT INTO lessons (title, description, content, chapter_id, order_index, lesson_type, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, ['Setting Up Your Development Environment', 'Learn how to set up the tools you need for web development.', '<h2>Development Environment Setup</h2><p>Let\'s get your computer ready for web development!</p><h3>Tools You\'ll Need:</h3><ul><li>Code Editor (VS Code recommended)</li><li>Web Browser (Chrome or Firefox)</li><li>Terminal/Command Line</li></ul><p>Follow along as we install and configure each tool.</p>', chapter1Result.rows[0].id, 2, 'text']);
        
        await pool.query(`
          INSERT INTO lessons (title, description, content, chapter_id, order_index, lesson_type, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, ['Introduction to HTML', 'Learn the basics of HTML markup language.', '<h2>What is HTML?</h2><p>HTML (HyperText Markup Language) is the standard markup language for creating web pages.</p><h3>Basic HTML Structure:</h3><pre><code>&lt;!DOCTYPE html&gt;\n&lt;html&gt;\n&lt;head&gt;\n    &lt;title&gt;My First Webpage&lt;/title&gt;\n&lt;/head&gt;\n&lt;body&gt;\n    &lt;h1&gt;Hello World!&lt;/h1&gt;\n&lt;/body&gt;\n&lt;/html&gt;</code></pre>', chapter2Result.rows[0].id, 1, 'text']);
        
        log("Demo lessons created successfully");
        
        // Create system settings
        await pool.query(`
          INSERT INTO system_settings (key, value)
          VALUES 
            ('allow_student_registration', 'true'),
            ('platform_name', 'Vibe LMS'),
            ('welcome_message', 'Welcome to your learning journey!')
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `);
        
        log("System settings created successfully");
        log("Initial demo data migration completed successfully");
      } else {
        log("Teacher user already exists, skipping demo data creation");
      }
    } catch (migrationError) {
      log(`Initial data migration error: ${migrationError}`, "migration");
      // Don't fail if demo data already exists
    }
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