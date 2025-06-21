import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { studentProgress, enrollments as enrollmentsTable, users, courses } from "@shared/schema";
import { sql, eq } from "drizzle-orm";
import { 
  insertCourseSchema, insertChapterSchema, insertLessonSchema, 
  insertQuestionSchema, insertMaterialSchema, insertEnrollmentSchema,
  insertStudentProgressSchema, insertUserSchema 
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import JSZip from "jszip";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// JWT middleware for authentication
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Security utility functions
function sanitizeFilename(filename: string): string {
  // Remove path traversal patterns and special characters
  return filename
    .replace(/[\.\/\\:*?"<>|]/g, '_')  // Replace dangerous chars with underscore
    .replace(/^\.+/, '')  // Remove leading dots
    .replace(/\s+/g, '_')  // Replace spaces with underscore
    .toLowerCase()
    .slice(0, 100);  // Limit length
}

function isValidPath(filePath: string): boolean {
  const normalizedPath = path.normalize(filePath);
  const uploadsDir = path.resolve('./uploads');
  
  // Handle both absolute and relative paths
  let resolvedPath: string;
  if (path.isAbsolute(normalizedPath)) {
    resolvedPath = normalizedPath;
  } else {
    resolvedPath = path.resolve('.', normalizedPath);
  }
  
  // Ensure the path is within the uploads directory or is a demo file
  return resolvedPath.startsWith(uploadsDir) || normalizedPath.includes('uploads/');
}

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const sanitizedName = sanitizeFilename(file.originalname);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = `${sanitizedName}_${uniqueSuffix}${ext}`;
      cb(null, filename);
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|md/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // JWT Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ token, user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...userData,
        role: "student" // Default role for registration
      });

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({ token, user });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.get("/api/auth/verify", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user });
    } catch (error) {
      console.error("Verify error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  // Health check endpoint for Docker
  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.authenticateUser(username, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate JWT token
      const { password: _, ...userWithoutPassword } = user;
      const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({ 
        token, 
        user: userWithoutPassword, 
        message: "Login successful" 
      });
    } catch (error) {
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      // Check if student registration is allowed globally
      const allowRegistration = await storage.getSystemSetting("allow_student_registration");
      if (allowRegistration === "false") {
        return res.status(403).json({ message: "Student registration is currently disabled" });
      }

      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const user = await storage.createUser(userData);
      const { password: _, ...userWithoutPassword } = user;
      
      // Generate JWT token for immediate login
      const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: '7d' });
      
      res.status(201).json({ 
        token, 
        user: userWithoutPassword, 
        message: "Registration successful" 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.post("/api/auth/register-teacher", async (req, res) => {
    try {
      const userData = insertUserSchema.parse({ ...req.body, role: "instructor" });
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const user = await storage.createUser(userData);
      const { password: _, ...userWithoutPassword } = user;
      
      // Generate JWT token
      const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: '7d' });
      
      res.status(201).json({ 
        token, 
        user: userWithoutPassword, 
        message: "Teacher registration successful" 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid teacher data" });
    }
  });

  // JWT verification endpoint
  app.get("/api/auth/verify", authenticateToken, async (req: any, res) => {
    try {
      // Token is valid, return user data from JWT payload
      const { password: _, ...userWithoutPassword } = req.user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(401).json({ message: "Invalid token" });
    }
  });

  app.put("/api/auth/change-password", async (req, res) => {
    try {
      const { userId, currentPassword, newPassword } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const authenticatedUser = await storage.authenticateUser(user.username, currentPassword);
      if (!authenticatedUser) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      
      const updatedUser = await storage.updateUserPassword(userId, newPassword);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.delete("/api/users/bulk", async (req, res) => {
    try {
      const { userIds } = req.body;
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "User IDs array is required" });
      }

      const deletedCount = await storage.deleteUsers(userIds);
      res.json({ message: `Successfully deleted ${deletedCount} users`, deletedCount });
    } catch (error) {
      console.error("Bulk user deletion error:", error);
      res.status(500).json({ message: "Failed to delete users" });
    }
  });

  app.post("/api/anonymous-user", async (req, res) => {
    try {
      // Create a unique anonymous user for this session
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const anonymousUsername = `anonymous_${timestamp}_${randomId}`;
      
      const userData = {
        username: anonymousUsername,
        email: `${anonymousUsername}@anonymous.local`,
        password: "no-password",
        role: "student"
      };
      
      const user = await storage.createUser(userData);
      res.status(201).json({ id: user.id, username: user.username });
    } catch (error) {
      console.error("Anonymous user creation error:", error);
      res.status(500).json({ message: "Failed to create anonymous user" });
    }
  });

  // Course routes
  app.get("/api/courses", async (req, res) => {
    try {
      const status = req.query.status as string;
      const courses = await storage.getCourses(status);
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const course = await storage.getCourseWithChapters(id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      res.status(400).json({ message: "Invalid course data" });
    }
  });

  app.put("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertCourseSchema.partial().parse(req.body);
      const course = await storage.updateCourse(id, updateData);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      res.status(400).json({ message: "Invalid course data" });
    }
  });

  app.delete("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Attempting to delete course with ID: ${id}`);
      const deleted = await storage.deleteCourse(id);
      if (!deleted) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Course deletion error:", error);
      res.status(500).json({ message: "Failed to delete course", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get public courses (no auth required)
  app.get("/api/public/courses", async (req, res) => {
    try {
      const courses = await storage.getPublicCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching public courses:", error);
      res.status(500).json({ error: "Failed to fetch public courses" });
    }
  });

  // Get public course details (no auth required)
  app.get("/api/public/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const course = await storage.getCourseWithChapters(id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      // Only return published courses
      if (course.status !== "published") {
        return res.status(403).json({ message: "Course is not public", redirect: "/login" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching public course:", error);
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  // Get public lesson details (no auth required)
  app.get("/api/public/lessons/:id/details", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lesson = await storage.getLessonWithDetails(id);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      // Get the chapter and verify it belongs to a published course
      const chapter = await storage.getChapter(lesson.chapterId);
      if (!chapter) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      const course = await storage.getCourse(chapter.courseId);
      if (!course || course.status !== "published") {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      res.json(lesson);
    } catch (error) {
      console.error("Error fetching public lesson:", error);
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  // System settings routes
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const value = await storage.getSystemSetting(req.params.key);
      res.json({ value: value || null });
    } catch (error) {
      res.status(500).json({ error: "Failed to get setting" });
    }
  });

  app.put("/api/settings/:key", async (req, res) => {
    try {
      const { value } = req.body;
      await storage.setSystemSetting(req.params.key, value);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // Chapter routes
  app.get("/api/courses/:courseId/chapters", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const chapters = await storage.getChaptersByCourse(courseId);
      res.json(chapters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chapters" });
    }
  });

  app.post("/api/chapters", async (req, res) => {
    try {
      console.log("Chapter creation request body:", req.body);
      const chapterData = insertChapterSchema.parse(req.body);
      console.log("Parsed chapter data:", chapterData);
      const chapter = await storage.createChapter(chapterData);
      console.log("Created chapter:", chapter);
      res.status(201).json(chapter);
    } catch (error) {
      console.error("Chapter creation error:", error);
      res.status(400).json({ message: "Invalid chapter data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/chapters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertChapterSchema.partial().parse(req.body);
      const chapter = await storage.updateChapter(id, updateData);
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      res.json(chapter);
    } catch (error) {
      res.status(400).json({ message: "Invalid chapter data" });
    }
  });

  app.delete("/api/chapters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteChapter(id);
      if (!deleted) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete chapter" });
    }
  });

  // Lesson routes
  app.get("/api/chapters/:chapterId/lessons", async (req, res) => {
    try {
      const chapterId = parseInt(req.params.chapterId);
      const lessons = await storage.getLessonsByChapter(chapterId);
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  app.get("/api/lessons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lesson = await storage.getLesson(id);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lesson" });
    }
  });

  app.get("/api/lessons/:id/details", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lesson = await storage.getLessonWithDetails(id);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lesson details" });
    }
  });

  app.post("/api/lessons", async (req, res) => {
    try {
      const lessonData = insertLessonSchema.parse(req.body);
      const lesson = await storage.createLesson(lessonData);
      res.status(201).json(lesson);
    } catch (error) {
      res.status(400).json({ message: "Invalid lesson data" });
    }
  });

  app.put("/api/lessons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertLessonSchema.partial().parse(req.body);
      const lesson = await storage.updateLesson(id, updateData);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      res.status(400).json({ message: "Invalid lesson data" });
    }
  });

  app.delete("/api/lessons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteLesson(id);
      if (!deleted) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete lesson" });
    }
  });

  // Question routes
  app.post("/api/questions", async (req, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      res.status(400).json({ message: "Invalid question data" });
    }
  });

  app.put("/api/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertQuestionSchema.partial().parse(req.body);
      const question = await storage.updateQuestion(id, updateData);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      res.status(400).json({ message: "Invalid question data" });
    }
  });

  app.delete("/api/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteQuestion(id);
      if (!deleted) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Material routes
  app.get("/api/materials", async (req, res) => {
    try {
      const materials = await storage.getMaterials();
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch materials" });
    }
  });

  app.post("/api/materials", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const materialData = {
        title: req.body.title || sanitizeFilename(req.file.originalname),
        fileName: sanitizeFilename(req.file.originalname),
        filePath: req.file.path,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        uploadedBy: 1, // TODO: Get from session
      };

      const material = await storage.createMaterial(materialData);
      res.status(201).json(material);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload material" });
    }
  });

  app.get("/api/materials/:id/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const material = await storage.getMaterial(id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      // Validate file path for security
      if (!isValidPath(material.filePath)) {
        return res.status(403).json({ message: "Access denied: Invalid file path" });
      }

      // Generate demo content for materials
      if (material.fileName.endsWith('.pdf')) {
        let pdfTitle = material.title;
        let pdfContent = '';
        
        switch (material.fileName) {
          case "web-dev-cheatsheet.pdf":
            pdfContent = "Web Development Cheat Sheet\n\nHTML - Structure\nCSS - Styling\nJavaScript - Functionality";
            break;
          case "html-reference.pdf":
            pdfContent = "HTML Reference Guide\n\nBasic Elements:\n<html>, <head>, <body>\n<h1>-<h6>, <p>, <div>\n<a>, <img>, <ul>, <li>\n\nSemantic Elements:\n<header>, <nav>, <main>\n<article>, <section>, <footer>";
            break;
          case "css-cheatsheet.pdf":
            pdfContent = "CSS Cheat Sheet\n\nSelectors:\n.class, #id, element\n\nLayout:\ndisplay: flex, grid\nposition: relative, absolute\n\nBox Model:\nmargin, border, padding, content";
            break;
          case "js-reference.pdf":
            pdfContent = "JavaScript Quick Reference\n\nVariables:\nlet, const, var\n\nFunctions:\nfunction name() {}\n() => {}\n\nDOM:\ndocument.querySelector()\nelement.addEventListener()";
            break;
          default:
            pdfContent = `${pdfTitle}\n\nThis is a reference document for web development learning.`;
        }

        const simplePdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length ${pdfContent.length + 50}>>stream
BT/F1 12 Tf 50 750 Td(${pdfTitle})Tj 0 -30 Td(${pdfContent.replace(/\n/g, ')Tj 0 -20 Td(')})Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref 0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000400 00000 n 
trailer<</Size 6/Root 1 0 R>>
startxref 467
%%EOF`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${material.fileName}"`);
        res.send(Buffer.from(simplePdf));
        return;
      }
      
      if (material.fileName === "starter-files.zip") {
        const zip = new JSZip();
        
        // Add HTML starter file
        zip.file("index.html", `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Portfolio</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <nav>
            <h1>Your Name</h1>
            <ul>
                <li><a href="#about">About</a></li>
                <li><a href="#skills">Skills</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section id="about">
            <h2>About Me</h2>
            <p>Write your introduction here...</p>
        </section>
        
        <section id="skills">
            <h2>Skills</h2>
            <ul>
                <li>HTML</li>
                <li>CSS</li>
                <li>JavaScript</li>
            </ul>
        </section>
        
        <section id="contact">
            <h2>Contact</h2>
            <p>Email: your.email@example.com</p>
        </section>
    </main>
    
    <script src="script.js"></script>
</body>
</html>`);

        // Add CSS starter file
        zip.file("style.css", `/* Reset and Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
}

/* Header Styles */
header {
    background: #2c3e50;
    color: white;
    padding: 1rem 0;
}

nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
}

nav ul {
    display: flex;
    list-style: none;
}

nav ul li {
    margin-left: 2rem;
}

nav ul li a {
    color: white;
    text-decoration: none;
}

/* Main Content */
main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

section {
    margin: 3rem 0;
}

h2 {
    color: #2c3e50;
    margin-bottom: 1rem;
}`);

        // Add JavaScript starter file
        zip.file("script.js", `// Smooth scrolling for navigation links
document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Add your JavaScript functionality here
console.log('Portfolio loaded successfully!');`);

        try {
          const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
          
          res.setHeader('Content-Type', 'application/zip');
          res.setHeader('Content-Disposition', `attachment; filename="${material.fileName}"`);
          res.send(zipBuffer);
          return;
        } catch (zipError) {
          console.error('ZIP generation error:', zipError);
          return res.status(500).json({ message: "Failed to generate ZIP file" });
        }
      }

      if (!fs.existsSync(material.filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      res.download(material.filePath, material.fileName);
    } catch (error) {
      res.status(500).json({ message: "Failed to download material" });
    }
  });

  app.post("/api/materials/:materialId/link/:lessonId", async (req, res) => {
    try {
      const materialId = parseInt(req.params.materialId);
      const lessonId = parseInt(req.params.lessonId);
      const success = await storage.linkMaterialToLesson(materialId, lessonId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to link material" });
    }
  });

  app.delete("/api/materials/:materialId/link/:lessonId", async (req, res) => {
    try {
      const materialId = parseInt(req.params.materialId);
      const lessonId = parseInt(req.params.lessonId);
      const success = await storage.unlinkMaterialFromLesson(materialId, lessonId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to unlink material" });
    }
  });

  app.delete("/api/materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Attempting to delete material with ID: ${id}`);
      const material = await storage.getMaterial(id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      // Delete file from disk (skip for demo files)
      if (fs.existsSync(material.filePath) && !material.filePath.includes('demo/')) {
        try {
          fs.unlinkSync(material.filePath);
          console.log(`Deleted file: ${material.filePath}`);
        } catch (fileError) {
          console.warn(`Could not delete file ${material.filePath}:`, fileError);
        }
      }

      const deleted = await storage.deleteMaterial(id);
      if (!deleted) {
        return res.status(404).json({ message: "Material not found in database" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Material deletion error:", error);
      res.status(500).json({ message: "Failed to delete material", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Enrollment routes
  app.get("/api/enrollments", async (req, res) => {
    try {
      // Get all enrollments and add user/course details
      const allUsers = await storage.getAllUsers();
      const allCourses = await storage.getCourses();
      const allEnrollments = await db.select().from(enrollmentsTable);
      
      const enrichedEnrollments = allEnrollments.map(enrollment => {
        const student = allUsers.find(u => u.id === enrollment.studentId);
        const course = allCourses.find(c => c.id === enrollment.courseId);
        
        return {
          ...enrollment,
          student: student ? {
            id: student.id,
            username: student.username,
            email: student.email,
            role: student.role
          } : null,
          course: course ? {
            id: course.id,
            title: course.title,
            status: course.status
          } : null
        };
      });
      
      res.json(enrichedEnrollments);
    } catch (error) {
      console.error("Enrollments API error:", error);
      res.status(500).json({ message: "Failed to fetch enrollments", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/courses/:courseId/enrollments", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const enrollments = await storage.getEnrollmentsByCourse(courseId);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.get("/api/enrollments/student/:studentId", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const enrollments = await storage.getEnrollmentsByStudent(studentId);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student enrollments" });
    }
  });

  app.post("/api/enrollments", async (req, res) => {
    try {
      const enrollmentData = insertEnrollmentSchema.parse(req.body);
      const enrollment = await storage.createEnrollment(enrollmentData);
      res.status(201).json(enrollment);
    } catch (error) {
      res.status(400).json({ message: "Invalid enrollment data" });
    }
  });

  // Progress tracking
  app.post("/api/progress", async (req, res) => {
    try {
      const progressData = insertStudentProgressSchema.parse(req.body);
      const progress = await storage.updateStudentProgress(progressData);
      
      // If lesson was completed, check if course should be marked as complete
      if (progressData.completed) {
        const lesson = await storage.getLesson(progressData.lessonId);
        if (lesson) {
          // Get the chapter to find the courseId
          const chapter = await storage.getChapter(lesson.chapterId);
          if (chapter) {
            const courseId = chapter.courseId;
            
            // Get all lessons in the course
            const course = await storage.getCourseWithChapters(courseId);
            if (course) {
              const allLessons = course.chapters.flatMap(chap => chap.lessons);
              const completedLessons = await storage.getStudentProgressByCourse(progressData.studentId, courseId);
              const completedLessonIds = completedLessons.filter(p => p.completed).map(p => p.lessonId);
              
              // Calculate completion percentage
              const completionPercentage = (completedLessonIds.length / allLessons.length) * 100;
              
              // Update or create enrollment progress
              const enrollments = await storage.getEnrollmentsByCourse(courseId);
              let enrollment = enrollments.find(e => e.studentId === progressData.studentId);
              
              if (!enrollment) {
                // Create enrollment for anonymous users or users who haven't enrolled yet
                enrollment = await storage.createEnrollment({
                  studentId: progressData.studentId,
                  courseId: courseId,
                  progress: 0,
                });
              }
              
              if (enrollment) {
                await storage.updateEnrollmentProgress(enrollment.id, completionPercentage);
              }
            }
          }
        }
      }
      
      res.json(progress);
    } catch (error) {
      res.status(400).json({ message: "Invalid progress data" });
    }
  });



  // Export functionality
  app.get("/api/courses/:id/export", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourseWithChapters(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const zip = new JSZip();

      // Create main course README
      let courseContent = `# ${course.title}\n\n`;
      if (course.description) {
        courseContent += `${course.description}\n\n`;
      }
      courseContent += `## Table of Contents\n\n`;

      for (const chapter of course.chapters) {
        courseContent += `- [${chapter.title}](#${chapter.title.toLowerCase().replace(/\s+/g, '-')})\n`;
        for (const lesson of chapter.lessons) {
          courseContent += `  - [${lesson.title}](#${lesson.title.toLowerCase().replace(/\s+/g, '-')})\n`;
        }
      }

      zip.file("README.md", courseContent);

      // Create chapter directories and files
      for (const chapter of course.chapters) {
        const chapterDir = `${chapter.orderIndex + 1}-${chapter.title.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        let chapterContent = `# ${chapter.title}\n\n`;
        if (chapter.description) {
          chapterContent += `${chapter.description}\n\n`;
        }

        zip.file(`${chapterDir}/README.md`, chapterContent);

        // Create lesson files
        for (const lesson of chapter.lessons) {
          const lessonFile = `${lesson.orderIndex + 1}-${lesson.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
          
          let lessonContent = `# ${lesson.title}\n\n`;
          
          if (lesson.videoUrl) {
            lessonContent += `## Video\n\n[Watch on YouTube](${lesson.videoUrl})\n\n`;
          }

          if (lesson.content) {
            lessonContent += `## Content\n\n${lesson.content}\n\n`;
          }

          if (lesson.codeExample) {
            lessonContent += `## Code Example\n\n\`\`\`${lesson.codeLanguage || 'javascript'}\n${lesson.codeExample}\n\`\`\`\n\n`;
          }

          // Add questions
          const questions = await storage.getQuestionsByLesson(lesson.id);
          if (questions.length > 0) {
            lessonContent += `## Assessment Questions\n\n`;
            questions.forEach((question, index) => {
              lessonContent += `### Question ${index + 1}\n\n${question.question}\n\n`;
              const options = question.options as string[];
              options.forEach((option, optIndex) => {
                const letter = String.fromCharCode(65 + optIndex);
                const isCorrect = optIndex === question.correctAnswer ? ' ✓' : '';
                lessonContent += `${letter}. ${option}${isCorrect}\n`;
              });
              if (question.explanation) {
                lessonContent += `\n**Explanation:** ${question.explanation}\n\n`;
              }
              lessonContent += '\n';
            });
          }

          if (lesson.assignment) {
            lessonContent += `## Practice Assignment\n\n${lesson.assignment}\n\n`;
          }

          // Add linked materials
          const materials = await storage.getMaterialsByLesson(lesson.id);
          if (materials.length > 0) {
            lessonContent += `## Materials\n\n`;
            materials.forEach(material => {
              lessonContent += `- [${material.title}](../materials/${material.fileName})\n`;
            });
          }

          zip.file(`${chapterDir}/${lessonFile}`, lessonContent);
        }
      }

      // Add materials directory
      const allMaterials = await storage.getMaterials();
      const materialsDir = zip.folder("materials");
      for (const material of allMaterials) {
        if (fs.existsSync(material.filePath)) {
          const fileData = fs.readFileSync(material.filePath);
          materialsDir?.file(material.fileName, fileData);
        }
      }

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${course.title.replace(/[^a-zA-Z0-9]/g, '_')}.zip"`);
      res.send(zipBuffer);

    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ message: "Failed to export course" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const courses = await storage.getCourses();
      const materials = await storage.getMaterials();
      const allUsers = await storage.getAllUsers();
      
      const totalCourses = courses.length;
      
      // Count all active learners including anonymous users
      const activeStudents = await storage.getActiveLearners();
      // Total enrolled students across all courses
      const totalEnrollments = courses.reduce((sum, course) => sum + course.studentsCount, 0);
      const totalMaterials = materials.length;
      
      // Calculate assignments count by getting all lessons with assignments
      let assignmentsCount = 0;
      for (const course of courses) {
        const chapters = await storage.getChaptersByCourse(course.id);
        for (const chapter of chapters) {
          const lessons = await storage.getLessonsByChapter(chapter.id);
          assignmentsCount += lessons.filter(lesson => lesson.assignment && lesson.assignment.trim() !== '').length;
        }
      }

      res.json({
        totalCourses,
        activeStudents,
        assignments: assignmentsCount,
        materials: totalMaterials,
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  return httpServer;
}
