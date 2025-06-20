import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCourseSchema, insertChapterSchema, insertLessonSchema, 
  insertQuestionSchema, insertMaterialSchema, insertEnrollmentSchema,
  insertStudentProgressSchema, insertUserSchema 
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import JSZip from "jszip";

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
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.authenticateUser(username, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, message: "Login successful" });
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
      res.status(201).json({ user: userWithoutPassword, message: "Registration successful" });
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
      res.status(201).json({ user: userWithoutPassword, message: "Teacher registration successful" });
    } catch (error) {
      res.status(400).json({ message: "Invalid teacher data" });
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
      const deleted = await storage.deleteCourse(id);
      if (!deleted) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete course" });
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
      res.status(400).json({ message: "Invalid chapter data", error: error.message });
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
        title: req.body.title || req.file.originalname,
        fileName: req.file.originalname,
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

      // For demo material, generate a sample PDF content
      if (material.fileName === "web-dev-cheatsheet.pdf") {
        const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 100
>>
stream
BT
/F1 12 Tf
100 700 Td
(Web Development Cheat Sheet) Tj
100 650 Td
(HTML - Structure) Tj
100 600 Td
(CSS - Styling) Tj
100 550 Td
(JavaScript - Functionality) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000423 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
489
%%EOF`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${material.fileName}"`);
        res.send(Buffer.from(pdfContent));
        return;
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
      const material = await storage.getMaterial(id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      // Delete file from disk
      if (fs.existsSync(material.filePath)) {
        fs.unlinkSync(material.filePath);
      }

      const deleted = await storage.deleteMaterial(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete material" });
    }
  });

  // Enrollment routes
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
              
              // Update enrollment progress
              const enrollments = await storage.getEnrollmentsByCourse(courseId);
              const enrollment = enrollments.find(e => e.studentId === progressData.studentId);
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
      
      const totalCourses = courses.length;
      const totalStudents = courses.reduce((sum, course) => sum + course.studentsCount, 0);
      const totalMaterials = materials.length;
      
      // Calculate assignments count (lessons with assignments)
      const allLessons = Array.from((storage as any).lessons.values());
      const assignmentsCount = allLessons.filter((lesson: any) => lesson.assignment).length;

      res.json({
        totalCourses,
        activeStudents: totalStudents,
        assignments: assignmentsCount,
        materials: totalMaterials,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
