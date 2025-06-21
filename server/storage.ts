import { 
  users, courses, chapters, lessons, questions, materials, 
  lessonMaterials, enrollments, studentProgress, systemSettings,
  type User, type InsertUser, type Course, type InsertCourse,
  type Chapter, type InsertChapter, type Lesson, type InsertLesson,
  type Question, type InsertQuestion, type Material, type InsertMaterial,
  type Enrollment, type InsertEnrollment, type StudentProgress, type InsertStudentProgress,
  type CourseWithStats, type ChapterWithLessons, type LessonWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: number, hashedPassword: string): Promise<User | undefined>;
  authenticateUser(username: string, password: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  deleteUsers(userIds: number[]): Promise<number>;

  // Course operations
  getCourses(status?: string): Promise<CourseWithStats[]>;
  getPublicCourses(): Promise<CourseWithStats[]>;
  getCourse(id: number): Promise<Course | undefined>;
  getCourseWithChapters(id: number): Promise<Course & { chapters: ChapterWithLessons[] } | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;

  // System settings
  getSystemSetting(key: string): Promise<string | undefined>;
  setSystemSetting(key: string, value: string): Promise<void>;

  // Analytics
  getActiveLearners(): Promise<number>;

  // Chapter operations
  getChaptersByCourse(courseId: number): Promise<Chapter[]>;
  getChapter(id: number): Promise<Chapter | undefined>;
  createChapter(chapter: InsertChapter): Promise<Chapter>;
  updateChapter(id: number, chapter: Partial<InsertChapter>): Promise<Chapter | undefined>;
  deleteChapter(id: number): Promise<boolean>;

  // Lesson operations
  getLessonsByChapter(chapterId: number): Promise<Lesson[]>;
  getLesson(id: number): Promise<Lesson | undefined>;
  getLessonWithDetails(id: number): Promise<LessonWithDetails | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, lesson: Partial<InsertLesson>): Promise<Lesson | undefined>;
  deleteLesson(id: number): Promise<boolean>;

  // Question operations
  getQuestionsByLesson(lessonId: number): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;

  // Material operations
  getMaterials(): Promise<Material[]>;
  getMaterial(id: number): Promise<Material | undefined>;
  getMaterialsByLesson(lessonId: number): Promise<Material[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  linkMaterialToLesson(materialId: number, lessonId: number): Promise<boolean>;
  unlinkMaterialFromLesson(materialId: number, lessonId: number): Promise<boolean>;
  deleteMaterial(id: number): Promise<boolean>;

  // Enrollment operations
  getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollmentProgress(id: number, progress: number): Promise<Enrollment | undefined>;

  // Progress tracking
  getStudentProgress(studentId: number, lessonId: number): Promise<StudentProgress | undefined>;
  updateStudentProgress(progress: InsertStudentProgress): Promise<StudentProgress>;
  getStudentProgressByCourse(studentId: number, courseId: number): Promise<StudentProgress[]>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length === 0) {
        await this.createDemoData();
      }
    } catch (error) {
      console.error("Failed to initialize database:", error);
    }
  }

  private async createDemoData() {
    const [teacher] = await db.insert(users).values({
      username: "teacher",
      password: this.hashPassword("teacher"),
      email: "teacher@example.com",
      role: "instructor",
    }).returning();

    const [course] = await db.insert(courses).values({
      title: "🎯 Demo Course - Web Development Basics",
      description: "Learn the fundamentals of web development with HTML, CSS, and JavaScript. This demo course shows all LMS features.",
      instructorId: teacher.id,
      status: "published",
      isPublic: true,
      allowRegistration: true,
    }).returning();

    const [chapter] = await db.insert(chapters).values({
      title: "Introduction to Web Development",
      description: "Getting started with the basics of web development",
      courseId: course.id,
      orderIndex: 0,
    }).returning();

    const [lesson] = await db.insert(lessons).values({
      title: "Welcome to Web Development",
      content: `
        <h2>Welcome to Web Development! 🚀</h2>
        <p>In this lesson, you'll learn the <strong>fundamentals</strong> of web development.</p>
        
        <h3>What you'll learn:</h3>
        <ul>
          <li><strong>HTML</strong> - Structure of web pages</li>
          <li><strong>CSS</strong> - Styling and layout</li>
          <li><strong>JavaScript</strong> - Interactive functionality</li>
        </ul>
        
        <h3>Key Concepts:</h3>
        <blockquote>
          <p><em>"The best way to learn web development is by building projects!"</em></p>
        </blockquote>
        
        <p>Ready to start your journey? Let's begin with the basics!</p>
      `,
      videoUrl: "https://www.youtube.com/watch?v=UB1O30fR-EE",
      assignment: "Create a simple HTML page with a heading, paragraph, and list. Practice what you learned in the video!",
      chapterId: chapter.id,
      orderIndex: 0,
    }).returning();

    await db.insert(questions).values([
      {
        lessonId: lesson.id,
        question: "What does HTML stand for?",
        options: ["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink and Text Markup Language"],
        correctAnswer: 0,
        orderIndex: 0,
      },
      {
        lessonId: lesson.id,
        question: "Which tag is used to create a paragraph in HTML?",
        options: ["<p>", "<paragraph>", "<para>", "<text>"],
        correctAnswer: 0,
        orderIndex: 1,
      }
    ]);

    const [material] = await db.insert(materials).values({
      title: "Web Development Cheat Sheet",
      fileName: "web-dev-cheatsheet.pdf",
      filePath: "uploads/web-dev-cheatsheet.pdf",
      fileSize: 1024000,
      fileType: "application/pdf",
      uploadedBy: teacher.id,
    }).returning();

    await db.insert(lessonMaterials).values({
      lessonId: lesson.id,
      materialId: material.id,
    });

    await db.insert(systemSettings).values({
      key: "allow_student_registration",
      value: "true",
    });
  }

  private hashPassword(password: string): string {
    return Buffer.from(password).toString('base64');
  }

  private verifyPassword(password: string, hashedPassword: string): boolean {
    return this.hashPassword(password) === hashedPassword;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      password: this.hashPassword(insertUser.password),
    }).returning();
    return user;
  }

  async updateUserPassword(id: number, newPassword: string): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ password: this.hashPassword(newPassword) })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async authenticateUser(username: string, password: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (user && this.verifyPassword(password, user.password)) {
      return user;
    }
    return undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUsers(userIds: number[]): Promise<number> {
    const result = await db.delete(users).where(
      userIds.length === 1 
        ? eq(users.id, userIds[0])
        : userIds.reduce((acc, id, index) => 
            index === 0 ? eq(users.id, id) : acc.or(eq(users.id, id))
          , eq(users.id, userIds[0]))
    );
    return result.rowCount || 0;
  }

  async getCourses(status?: string): Promise<CourseWithStats[]> {
    const coursesData = await db.select().from(courses);
    
    const coursesWithStats: CourseWithStats[] = [];
    for (const course of coursesData) {
      const chaptersCount = await db.select().from(chapters).where(eq(chapters.courseId, course.id));
      const lessonsCount = await db.select().from(lessons)
        .innerJoin(chapters, eq(lessons.chapterId, chapters.id))
        .where(eq(chapters.courseId, course.id));
      const enrollmentsList = await db.select().from(enrollments).where(eq(enrollments.courseId, course.id));
      
      // Calculate average progress across all enrollments
      let averageProgress = 0;
      if (enrollmentsList.length > 0) {
        const totalProgress = enrollmentsList.reduce((sum, enrollment) => sum + (enrollment.progress || 0), 0);
        averageProgress = Math.round(totalProgress / enrollmentsList.length);
      }
      
      coursesWithStats.push({
        ...course,
        chaptersCount: chaptersCount.length,
        lessonsCount: lessonsCount.length,
        studentsCount: enrollmentsList.length,
        averageProgress,
      });
    }
    
    return status ? coursesWithStats.filter(c => c.status === status) : coursesWithStats;
  }

  async getPublicCourses(): Promise<CourseWithStats[]> {
    const allCourses = await this.getCourses();
    return allCourses.filter(course => course.status === "published" && course.isPublic);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async getCourseWithChapters(id: number): Promise<Course & { chapters: ChapterWithLessons[] } | undefined> {
    const course = await this.getCourse(id);
    if (!course) return undefined;

    const courseChapters = await db.select().from(chapters)
      .where(eq(chapters.courseId, id))
      .orderBy(chapters.orderIndex);

    const chaptersWithLessons: ChapterWithLessons[] = [];
    for (const chapter of courseChapters) {
      const chapterLessons = await db.select().from(lessons)
        .where(eq(lessons.chapterId, chapter.id))
        .orderBy(lessons.orderIndex);
      
      chaptersWithLessons.push({
        ...chapter,
        lessons: chapterLessons,
      });
    }

    return {
      ...course,
      chapters: chaptersWithLessons,
    };
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(insertCourse).returning();
    return course;
  }

  async updateCourse(id: number, updateData: Partial<InsertCourse>): Promise<Course | undefined> {
    const [course] = await db.update(courses)
      .set(updateData)
      .where(eq(courses.id, id))
      .returning();
    return course || undefined;
  }

  async deleteCourse(id: number): Promise<boolean> {
    try {
      // Delete in correct order due to foreign key constraints
      
      // 1. Delete student progress for lessons in this course
      const courseChapters = await db.select().from(chapters).where(eq(chapters.courseId, id));
      for (const chapter of courseChapters) {
        const chapterLessons = await db.select().from(lessons).where(eq(lessons.chapterId, chapter.id));
        for (const lesson of chapterLessons) {
          await db.delete(studentProgress).where(eq(studentProgress.lessonId, lesson.id));
          await db.delete(questions).where(eq(questions.lessonId, lesson.id));
          await db.delete(lessonMaterials).where(eq(lessonMaterials.lessonId, lesson.id));
        }
        await db.delete(lessons).where(eq(lessons.chapterId, chapter.id));
      }
      
      // 2. Delete enrollments
      await db.delete(enrollments).where(eq(enrollments.courseId, id));
      
      // 3. Delete chapters
      await db.delete(chapters).where(eq(chapters.courseId, id));
      
      // 4. Finally delete the course
      const result = await db.delete(courses).where(eq(courses.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  async getChaptersByCourse(courseId: number): Promise<Chapter[]> {
    return await db.select().from(chapters)
      .where(eq(chapters.courseId, courseId))
      .orderBy(chapters.orderIndex);
  }

  async getChapter(id: number): Promise<Chapter | undefined> {
    const [chapter] = await db.select().from(chapters).where(eq(chapters.id, id));
    return chapter || undefined;
  }

  async createChapter(insertChapter: InsertChapter): Promise<Chapter> {
    const [chapter] = await db.insert(chapters).values(insertChapter).returning();
    return chapter;
  }

  async updateChapter(id: number, updateData: Partial<InsertChapter>): Promise<Chapter | undefined> {
    const [chapter] = await db.update(chapters)
      .set(updateData)
      .where(eq(chapters.id, id))
      .returning();
    return chapter || undefined;
  }

  async deleteChapter(id: number): Promise<boolean> {
    const result = await db.delete(chapters).where(eq(chapters.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getLessonsByChapter(chapterId: number): Promise<Lesson[]> {
    return await db.select().from(lessons)
      .where(eq(lessons.chapterId, chapterId))
      .orderBy(lessons.orderIndex);
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson || undefined;
  }

  async getLessonWithDetails(id: number): Promise<LessonWithDetails | undefined> {
    const lesson = await this.getLesson(id);
    if (!lesson) return undefined;

    const lessonQuestions = await db.select().from(questions)
      .where(eq(questions.lessonId, id))
      .orderBy(questions.orderIndex);

    const lessonMaterialsList = await db.select({
      id: materials.id,
      title: materials.title,
      fileName: materials.fileName,
      filePath: materials.filePath,
      fileSize: materials.fileSize,
      fileType: materials.fileType,
      uploadedBy: materials.uploadedBy,
      createdAt: materials.createdAt,
    })
    .from(materials)
    .innerJoin(lessonMaterials, eq(materials.id, lessonMaterials.materialId))
    .where(eq(lessonMaterials.lessonId, id));

    return {
      ...lesson,
      questions: lessonQuestions,
      materials: lessonMaterialsList,
    };
  }

  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    const [lesson] = await db.insert(lessons).values(insertLesson).returning();
    return lesson;
  }

  async updateLesson(id: number, updateData: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const [lesson] = await db.update(lessons)
      .set(updateData)
      .where(eq(lessons.id, id))
      .returning();
    return lesson || undefined;
  }

  async deleteLesson(id: number): Promise<boolean> {
    const result = await db.delete(lessons).where(eq(lessons.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getQuestionsByLesson(lessonId: number): Promise<Question[]> {
    return await db.select().from(questions)
      .where(eq(questions.lessonId, lessonId))
      .orderBy(questions.orderIndex);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db.insert(questions).values(insertQuestion).returning();
    return question;
  }

  async updateQuestion(id: number, updateData: Partial<InsertQuestion>): Promise<Question | undefined> {
    const [question] = await db.update(questions)
      .set(updateData)
      .where(eq(questions.id, id))
      .returning();
    return question || undefined;
  }

  async deleteQuestion(id: number): Promise<boolean> {
    const result = await db.delete(questions).where(eq(questions.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getMaterials(): Promise<Material[]> {
    return await db.select().from(materials);
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    return material || undefined;
  }

  async getMaterialsByLesson(lessonId: number): Promise<Material[]> {
    return await db.select({
      id: materials.id,
      title: materials.title,
      fileName: materials.fileName,
      filePath: materials.filePath,
      fileSize: materials.fileSize,
      fileType: materials.fileType,
      uploadedBy: materials.uploadedBy,
      createdAt: materials.createdAt,
    })
    .from(materials)
    .innerJoin(lessonMaterials, eq(materials.id, lessonMaterials.materialId))
    .where(eq(lessonMaterials.lessonId, lessonId));
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const [material] = await db.insert(materials).values(insertMaterial).returning();
    return material;
  }

  async linkMaterialToLesson(materialId: number, lessonId: number): Promise<boolean> {
    try {
      await db.insert(lessonMaterials).values({ materialId, lessonId });
      return true;
    } catch {
      return false;
    }
  }

  async unlinkMaterialFromLesson(materialId: number, lessonId: number): Promise<boolean> {
    const result = await db.delete(lessonMaterials)
      .where(and(
        eq(lessonMaterials.materialId, materialId),
        eq(lessonMaterials.lessonId, lessonId)
      ));
    return (result.rowCount || 0) > 0;
  }

  async deleteMaterial(id: number): Promise<boolean> {
    try {
      // First delete all lesson-material links
      await db.delete(lessonMaterials).where(eq(lessonMaterials.materialId, id));
      
      // Then delete the material
      const result = await db.delete(materials).where(eq(materials.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting material:', error);
      throw error;
    }
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const [enrollment] = await db.insert(enrollments).values(insertEnrollment).returning();
    return enrollment;
  }

  async updateEnrollmentProgress(id: number, progress: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.update(enrollments)
      .set({ progress })
      .where(eq(enrollments.id, id))
      .returning();
    return enrollment || undefined;
  }

  async getStudentProgress(studentId: number, lessonId: number): Promise<StudentProgress | undefined> {
    const [progress] = await db.select().from(studentProgress)
      .where(and(
        eq(studentProgress.studentId, studentId),
        eq(studentProgress.lessonId, lessonId)
      ));
    return progress || undefined;
  }

  async updateStudentProgress(insertProgress: InsertStudentProgress): Promise<StudentProgress> {
    const existing = await this.getStudentProgress(insertProgress.studentId, insertProgress.lessonId);
    
    if (existing) {
      const [progress] = await db.update(studentProgress)
        .set(insertProgress)
        .where(and(
          eq(studentProgress.studentId, insertProgress.studentId),
          eq(studentProgress.lessonId, insertProgress.lessonId)
        ))
        .returning();
      return progress;
    } else {
      const [progress] = await db.insert(studentProgress).values(insertProgress).returning();
      return progress;
    }
  }

  async getStudentProgressByCourse(studentId: number, courseId: number): Promise<StudentProgress[]> {
    const result = await db.select({
      id: studentProgress.id,
      lessonId: studentProgress.lessonId,
      studentId: studentProgress.studentId,
      completed: studentProgress.completed,
      completedAt: studentProgress.completedAt,
      score: studentProgress.score,
    })
    .from(studentProgress)
    .innerJoin(lessons, eq(studentProgress.lessonId, lessons.id))
    .innerJoin(chapters, eq(lessons.chapterId, chapters.id))
    .where(and(
      eq(studentProgress.studentId, studentId),
      eq(chapters.courseId, courseId)
    ));
    
    return result;
  }

  async getSystemSetting(key: string): Promise<string | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting?.value || undefined;
  }

  async setSystemSetting(key: string, value: string): Promise<void> {
    const existing = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    
    if (existing.length > 0) {
      await db.update(systemSettings)
        .set({ value })
        .where(eq(systemSettings.key, key));
    } else {
      await db.insert(systemSettings).values({ key, value });
    }
  }

  async getActiveLearners(): Promise<number> {
    // Count unique student IDs from student_progress table (includes anonymous users)
    const result = await db.selectDistinct({ studentId: studentProgress.studentId })
      .from(studentProgress);
    return result.length;
  }
}

export const storage = new DatabaseStorage();