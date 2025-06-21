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
    
    // Run initial data migration
    log("Running initial data migration...");
    try {
      await execAsync(`psql "${process.env.DATABASE_URL}" -f migrations/0001_initial_demo_data.sql`);
      log("Initial data migration completed successfully");
    } catch (migrationError) {
      log(`Initial data migration warning: ${migrationError}`, "migration");
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