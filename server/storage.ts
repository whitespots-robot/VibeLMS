import { 
  users, courses, chapters, lessons, questions, materials, lessonMaterials, 
  enrollments, studentProgress,
  type User, type InsertUser,
  type Course, type InsertCourse, type CourseWithStats,
  type Chapter, type InsertChapter, type ChapterWithLessons,
  type Lesson, type InsertLesson, type LessonWithDetails,
  type Question, type InsertQuestion,
  type Material, type InsertMaterial,
  type Enrollment, type InsertEnrollment,
  type StudentProgress, type InsertStudentProgress
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Course operations
  getCourses(status?: string): Promise<CourseWithStats[]>;
  getCourse(id: number): Promise<Course | undefined>;
  getCourseWithChapters(id: number): Promise<Course & { chapters: ChapterWithLessons[] } | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;

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

export class MemStorage implements IStorage {
  private users = new Map<number, User>();
  private courses = new Map<number, Course>();
  private chapters = new Map<number, Chapter>();
  private lessons = new Map<number, Lesson>();
  private questions = new Map<number, Question>();
  private materials = new Map<number, Material>();
  private lessonMaterialLinks = new Map<string, { lessonId: number; materialId: number }>();
  private enrollments = new Map<number, Enrollment>();
  private studentProgressMap = new Map<number, StudentProgress>();

  private currentUserId = 1;
  private currentCourseId = 1;
  private currentChapterId = 1;
  private currentLessonId = 1;
  private currentQuestionId = 1;
  private currentMaterialId = 1;
  private currentEnrollmentId = 1;
  private currentProgressId = 1;

  constructor() {
    // Initialize with demo instructor
    this.users.set(1, {
      id: 1,
      username: "instructor",
      password: "password",
      email: "instructor@example.com",
      role: "instructor",
      createdAt: new Date(),
    });
    this.currentUserId = 2;
    
    // Create demo course
    this.createDemoCourse();
  }

  private async createDemoCourse() {
    // Create demo course
    const demoCourse: Course = {
      id: 1,
      title: "🎯 Demo Course - Web Development Basics",
      description: "Learn the fundamentals of web development with HTML, CSS, and JavaScript. This demo course shows all LMS features.",
      instructorId: 1,
      status: "published",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.courses.set(1, demoCourse);
    this.currentCourseId = 2;

    // Create demo chapter
    const demoChapter: Chapter = {
      id: 1,
      title: "Introduction to Web Development",
      description: "Getting started with the basics of web development",
      courseId: 1,
      orderIndex: 0,
      createdAt: new Date(),
    };
    this.chapters.set(1, demoChapter);
    this.currentChapterId = 2;

    // Create demo lesson with rich content
    const demoLesson: Lesson = {
      id: 1,
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
      codeExample: null,
      codeLanguage: null,
      assignment: "Create a simple HTML page with a heading, paragraph, and list. Practice what you learned in the video!",
      chapterId: 1,
      orderIndex: 0,
      createdAt: new Date(),
    };
    this.lessons.set(1, demoLesson);
    this.currentLessonId = 2;

    // Create demo questions
    const demoQuestion1: Question = {
      id: 1,
      lessonId: 1,
      question: "What does HTML stand for?",
      options: ["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink and Text Markup Language"],
      correctAnswer: 0,
      explanation: "HTML stands for HyperText Markup Language - it's the standard markup language for creating web pages.",
      orderIndex: 0,
    };
    
    const demoQuestion2: Question = {
      id: 2,
      lessonId: 1,
      question: "Which of these is used for styling web pages?",
      options: ["HTML", "CSS", "JavaScript", "Python"],
      correctAnswer: 1,
      explanation: "CSS (Cascading Style Sheets) is used to style and layout web pages, including colors, fonts, and positioning.",
      orderIndex: 1,
    };

    this.questions.set(1, demoQuestion1);
    this.questions.set(2, demoQuestion2);
    this.currentQuestionId = 3;

    // Create demo material
    const demoMaterial: Material = {
      id: 1,
      title: "Web Development Cheat Sheet",
      fileName: "web-dev-cheatsheet.txt",
      filePath: "./demo/web-dev-cheatsheet.txt",
      fileType: "text/plain",
      fileSize: 512,
      createdAt: new Date(),
    };
    this.materials.set(1, demoMaterial);
    this.currentMaterialId = 2;

    // Link material to demo lesson
    const linkKey = `${1}-${1}`; // lessonId-materialId
    this.lessonMaterialLinks.set(linkKey, { lessonId: 1, materialId: 1 });

    // Create demo enrollment
    const demoEnrollment: Enrollment = {
      id: 1,
      courseId: 1,
      studentId: 1,
      progress: 0,
      enrolledAt: new Date(),
    };
    this.enrollments.set(1, demoEnrollment);
    this.currentEnrollmentId = 2;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      role: insertUser.role || "student",
      id: this.currentUserId++,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  // Course operations
  async getCourses(status?: string): Promise<CourseWithStats[]> {
    const coursesWithStats: CourseWithStats[] = [];
    
    for (const course of Array.from(this.courses.values())) {
      // Filter by status if provided
      if (status && course.status !== status) {
        continue;
      }
      
      const chapters = Array.from(this.chapters.values()).filter(c => c.courseId === course.id);
      const lessonsCount = chapters.reduce((count, chapter) => {
        return count + Array.from(this.lessons.values()).filter(l => l.chapterId === chapter.id).length;
      }, 0);
      
      const enrollmentsForCourse = Array.from(this.enrollments.values()).filter(e => e.courseId === course.id);
      const averageProgress = enrollmentsForCourse.length > 0 
        ? enrollmentsForCourse.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollmentsForCourse.length
        : 0;

      coursesWithStats.push({
        ...course,
        chaptersCount: chapters.length,
        lessonsCount,
        studentsCount: enrollmentsForCourse.length,
        averageProgress: Math.round(averageProgress),
      });
    }
    
    return coursesWithStats;
  }

  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCourseWithChapters(id: number): Promise<Course & { chapters: ChapterWithLessons[] } | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;

    const chapters = Array.from(this.chapters.values())
      .filter(c => c.courseId === id)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const chaptersWithLessons: ChapterWithLessons[] = chapters.map(chapter => ({
      ...chapter,
      lessons: Array.from(this.lessons.values())
        .filter(l => l.chapterId === chapter.id)
        .sort((a, b) => a.orderIndex - b.orderIndex),
    }));

    return {
      ...course,
      chapters: chaptersWithLessons,
    };
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const course: Course = {
      ...insertCourse,
      description: insertCourse.description || null,
      status: insertCourse.status || "draft",
      id: this.currentCourseId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.courses.set(course.id, course);
    return course;
  }

  async updateCourse(id: number, updateData: Partial<InsertCourse>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;

    const updatedCourse = {
      ...course,
      ...updateData,
      updatedAt: new Date(),
    };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    const course = this.courses.get(id);
    if (!course) return false;

    // Delete all chapters and their lessons for this course
    const chapters = Array.from(this.chapters.values()).filter(c => c.courseId === id);
    for (const chapter of chapters) {
      // Delete all lessons in this chapter
      const lessons = Array.from(this.lessons.values()).filter(l => l.chapterId === chapter.id);
      for (const lesson of lessons) {
        // Delete questions for this lesson
        const questions = Array.from(this.questions.values()).filter(q => q.lessonId === lesson.id);
        questions.forEach(q => this.questions.delete(q.id));
        
        // Delete lesson material links
        const linkKeys = Array.from(this.lessonMaterialLinks.keys())
          .filter(key => this.lessonMaterialLinks.get(key)?.lessonId === lesson.id);
        linkKeys.forEach(key => this.lessonMaterialLinks.delete(key));
        
        // Delete the lesson
        this.lessons.delete(lesson.id);
      }
      // Delete the chapter
      this.chapters.delete(chapter.id);
    }

    // Delete enrollments for this course
    const enrollments = Array.from(this.enrollments.values()).filter(e => e.courseId === id);
    enrollments.forEach(e => this.enrollments.delete(e.id));

    // Delete the course
    return this.courses.delete(id);
  }

  // Chapter operations
  async getChaptersByCourse(courseId: number): Promise<Chapter[]> {
    return Array.from(this.chapters.values())
      .filter(c => c.courseId === courseId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async getChapter(id: number): Promise<Chapter | undefined> {
    return this.chapters.get(id);
  }

  async createChapter(insertChapter: InsertChapter): Promise<Chapter> {
    const chapter: Chapter = {
      ...insertChapter,
      description: insertChapter.description || null,
      orderIndex: insertChapter.orderIndex || 0,
      id: this.currentChapterId++,
      createdAt: new Date(),
    };
    this.chapters.set(chapter.id, chapter);
    return chapter;
  }

  async updateChapter(id: number, updateData: Partial<InsertChapter>): Promise<Chapter | undefined> {
    const chapter = this.chapters.get(id);
    if (!chapter) return undefined;

    const updatedChapter = { ...chapter, ...updateData };
    this.chapters.set(id, updatedChapter);
    return updatedChapter;
  }

  async deleteChapter(id: number): Promise<boolean> {
    return this.chapters.delete(id);
  }

  // Lesson operations
  async getLessonsByChapter(chapterId: number): Promise<Lesson[]> {
    return Array.from(this.lessons.values())
      .filter(l => l.chapterId === chapterId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    return this.lessons.get(id);
  }

  async getLessonWithDetails(id: number): Promise<LessonWithDetails | undefined> {
    const lesson = this.lessons.get(id);
    if (!lesson) return undefined;

    const questions = Array.from(this.questions.values())
      .filter(q => q.lessonId === id)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const materialIds = Array.from(this.lessonMaterialLinks.values())
      .filter(link => link.lessonId === id)
      .map(link => link.materialId);
    
    const materials = materialIds
      .map(id => this.materials.get(id))
      .filter((m): m is Material => m !== undefined);

    return {
      ...lesson,
      questions,
      materials,
    };
  }

  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    const lesson: Lesson = {
      ...insertLesson,
      content: insertLesson.content || null,
      videoUrl: insertLesson.videoUrl || null,
      codeExample: insertLesson.codeExample || null,
      codeLanguage: insertLesson.codeLanguage || null,
      assignment: insertLesson.assignment || null,
      orderIndex: insertLesson.orderIndex || 0,
      id: this.currentLessonId++,
      createdAt: new Date(),
    };
    this.lessons.set(lesson.id, lesson);
    return lesson;
  }

  async updateLesson(id: number, updateData: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const lesson = this.lessons.get(id);
    if (!lesson) return undefined;

    const updatedLesson = { ...lesson, ...updateData };
    this.lessons.set(id, updatedLesson);
    return updatedLesson;
  }

  async deleteLesson(id: number): Promise<boolean> {
    return this.lessons.delete(id);
  }

  // Question operations
  async getQuestionsByLesson(lessonId: number): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(q => q.lessonId === lessonId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const question: Question = {
      ...insertQuestion,
      explanation: insertQuestion.explanation || null,
      orderIndex: insertQuestion.orderIndex || 0,
      id: this.currentQuestionId++,
    };
    this.questions.set(question.id, question);
    return question;
  }

  async updateQuestion(id: number, updateData: Partial<InsertQuestion>): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;

    const updatedQuestion = { ...question, ...updateData };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }

  async deleteQuestion(id: number): Promise<boolean> {
    return this.questions.delete(id);
  }

  // Material operations
  async getMaterials(): Promise<Material[]> {
    return Array.from(this.materials.values());
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    return this.materials.get(id);
  }

  async getMaterialsByLesson(lessonId: number): Promise<Material[]> {
    const materialIds = Array.from(this.lessonMaterialLinks.values())
      .filter(link => link.lessonId === lessonId)
      .map(link => link.materialId);
    
    return materialIds
      .map(id => this.materials.get(id))
      .filter((m): m is Material => m !== undefined);
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const material: Material = {
      ...insertMaterial,
      id: this.currentMaterialId++,
      createdAt: new Date(),
    };
    this.materials.set(material.id, material);
    return material;
  }

  async linkMaterialToLesson(materialId: number, lessonId: number): Promise<boolean> {
    const key = `${lessonId}-${materialId}`;
    this.lessonMaterialLinks.set(key, { lessonId, materialId });
    return true;
  }

  async unlinkMaterialFromLesson(materialId: number, lessonId: number): Promise<boolean> {
    const key = `${lessonId}-${materialId}`;
    return this.lessonMaterialLinks.delete(key);
  }

  async deleteMaterial(id: number): Promise<boolean> {
    return this.materials.delete(id);
  }

  // Enrollment operations
  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(e => e.courseId === courseId);
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(e => e.studentId === studentId);
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const enrollment: Enrollment = {
      ...insertEnrollment,
      progress: insertEnrollment.progress || null,
      id: this.currentEnrollmentId++,
      enrolledAt: new Date(),
    };
    this.enrollments.set(enrollment.id, enrollment);
    return enrollment;
  }

  async updateEnrollmentProgress(id: number, progress: number): Promise<Enrollment | undefined> {
    const enrollment = this.enrollments.get(id);
    if (!enrollment) return undefined;

    const updatedEnrollment = { ...enrollment, progress };
    this.enrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }

  // Progress tracking
  async getStudentProgress(studentId: number, lessonId: number): Promise<StudentProgress | undefined> {
    return Array.from(this.studentProgressMap.values())
      .find(p => p.studentId === studentId && p.lessonId === lessonId);
  }

  async updateStudentProgress(insertProgress: InsertStudentProgress): Promise<StudentProgress> {
    const existing = await this.getStudentProgress(insertProgress.studentId, insertProgress.lessonId);
    
    if (existing) {
      const updated = { 
        ...existing, 
        ...insertProgress,
        completedAt: insertProgress.completed ? new Date() : existing.completedAt,
      };
      this.studentProgressMap.set(existing.id, updated);
      return updated;
    } else {
      const progress: StudentProgress = {
        ...insertProgress,
        completed: insertProgress.completed || null,
        score: insertProgress.score || null,
        id: this.currentProgressId++,
        completedAt: insertProgress.completed ? new Date() : null,
      };
      this.studentProgressMap.set(progress.id, progress);
      return progress;
    }
  }

  async getStudentProgressByCourse(studentId: number, courseId: number): Promise<StudentProgress[]> {
    const chapters = Array.from(this.chapters.values()).filter(c => c.courseId === courseId);
    const lessonIds = chapters.flatMap(chapter => 
      Array.from(this.lessons.values())
        .filter(l => l.chapterId === chapter.id)
        .map(l => l.id)
    );

    return Array.from(this.studentProgressMap.values())
      .filter(p => p.studentId === studentId && lessonIds.includes(p.lessonId));
  }
}

export const storage = new MemStorage();
