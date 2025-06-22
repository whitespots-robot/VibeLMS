#!/usr/bin/env node

import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';

async function createTestData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🚀 Creating test data...');

    // Hash the password
    const hashedPassword = bcrypt.hashSync('teacher', 10);

    // Create teacher user with instructor role
    const userResult = await pool.query(`
      INSERT INTO users (username, email, password, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO UPDATE SET
        email = EXCLUDED.email,
        password = EXCLUDED.password,
        role = EXCLUDED.role
      RETURNING id, username, role
    `, ['teacher', 'teacher@example.com', hashedPassword, 'instructor']);

    const teacherId = userResult.rows[0].id;
    console.log(`✅ Created user: ${userResult.rows[0].username} (ID: ${teacherId}, role: ${userResult.rows[0].role})`);

    // Create test course
    const courseResult = await pool.query(`
      INSERT INTO courses (title, description, instructor_id, status, is_public, allow_registration)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
      RETURNING id, title
    `, [
      '🎓 Programming Fundamentals',
      'Complete course on programming fundamentals for beginners. Learn variables, loops, functions and object-oriented programming.',
      teacherId,
      'published',
      true,
      true
    ]);

    if (courseResult.rows.length > 0) {
      const courseId = courseResult.rows[0].id;
      console.log(`✅ Created course: ${courseResult.rows[0].title} (ID: ${courseId})`);

      // Create course chapters
      const chapters = [
        { title: '📚 Introduction to Programming', order: 1 },
        { title: '🔤 Variables and Data Types', order: 2 },
        { title: '🔄 Loops and Conditions', order: 3 },
        { title: '⚙️ Functions', order: 4 },
        { title: '🏗️ Object-Oriented Programming', order: 5 }
      ];

      for (const chapter of chapters) {
        const chapterResult = await pool.query(`
          INSERT INTO chapters (title, course_id, order_index)
          VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING
          RETURNING id, title
        `, [chapter.title, courseId, chapter.order]);

        if (chapterResult.rows.length > 0) {
          const chapterId = chapterResult.rows[0].id;
          console.log(`  ✅ Created chapter: ${chapterResult.rows[0].title}`);

          // Create lessons for each chapter
          const lessons = getLessonsForChapter(chapter.order);
          
          for (let i = 0; i < lessons.length; i++) {
            const lesson = lessons[i];
            const lessonResult = await pool.query(`
              INSERT INTO lessons (title, content, chapter_id, order_index)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT DO NOTHING
              RETURNING id, title
            `, [lesson.title, lesson.content, chapterId, i + 1]);

            if (lessonResult.rows.length > 0) {
              console.log(`    ✅ Created lesson: ${lessonResult.rows[0].title}`);
            }
          }
        }
      }
    } else {
      console.log('ℹ️ Course already exists, skipping creation');
    }

    console.log('🎉 Test data created successfully!');
    console.log('');
    console.log('📋 Login credentials:');
    console.log('   Username: teacher');
    console.log('   Password: teacher');
    console.log('   Role: instructor');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

function getLessonsForChapter(chapterOrder) {
  const lessonsMap = {
    1: [ // Introduction to Programming
      {
        title: 'What is Programming?',
        content: '# What is Programming?\n\nProgramming is the process of creating instructions for a computer. In this lesson we will learn basic concepts and terminology.'
      },
      {
        title: 'History of Programming Languages',
        content: '# History of Programming Languages\n\nFrom machine code to modern high-level languages - a journey through programming history.'
      }
    ],
    2: [ // Variables and Data Types
      {
        title: 'Variables: What They Are and Why We Need Them',
        content: '# Variables\n\nVariables are containers for storing data. Let\'s learn how to create and use them.\n\n```javascript\nlet name = "John";\nlet age = 25;\nconsole.log(name, age);\n```'
      },
      {
        title: 'Data Types: Numbers, Strings, Booleans',
        content: '# Data Types\n\nBasic data types in programming:\n\n- **Numbers**: 42, 3.14\n- **Strings**: "Hello, World!"\n- **Booleans**: true, false'
      }
    ],
    3: [ // Loops and Conditions
      {
        title: 'Conditional Statements if/else',
        content: '# Conditional Statements\n\nConditions allow programs to make decisions:\n\n```javascript\nif (age >= 18) {\n  console.log("Adult");\n} else {\n  console.log("Minor");\n}\n```'
      },
      {
        title: 'Loops: for and while',
        content: '# Loops\n\nLoops allow you to repeat code:\n\n```javascript\n// For loop\nfor (let i = 0; i < 5; i++) {\n  console.log(i);\n}\n\n// While loop\nlet count = 0;\nwhile (count < 3) {\n  console.log(count);\n  count++;\n}\n```'
      }
    ],
    4: [ // Functions
      {
        title: 'Creating and Calling Functions',
        content: '# Functions\n\nFunctions are reusable blocks of code:\n\n```javascript\nfunction greet(name) {\n  return "Hello, " + name + "!";\n}\n\nconsole.log(greet("Anna"));\n```'
      },
      {
        title: 'Parameters and Return Values',
        content: '# Parameters and Return Values\n\nFunctions can accept parameters and return results:\n\n```javascript\nfunction add(a, b) {\n  return a + b;\n}\n\nlet result = add(5, 3);\nconsole.log(result); // 8\n```'
      }
    ],
    5: [ // OOP
      {
        title: 'Object-Oriented Programming Basics',
        content: '# OOP: Basics\n\nObject-Oriented Programming (OOP) is a programming paradigm based on the concept of objects.\n\n## Core Principles:\n- Encapsulation\n- Inheritance\n- Polymorphism'
      },
      {
        title: 'Classes and Objects',
        content: '# Classes and Objects\n\nClasses are templates for creating objects:\n\n```javascript\nclass Person {\n  constructor(name, age) {\n    this.name = name;\n    this.age = age;\n  }\n  \n  greet() {\n    return `Hello, my name is ${this.name}`;\n  }\n}\n\nlet person = new Person("Peter", 30);\nconsole.log(person.greet());\n```'
      }
    ]
  };

  return lessonsMap[chapterOrder] || [];
}

// Запускаем создание данных
createTestData();