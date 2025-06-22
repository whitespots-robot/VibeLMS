#!/usr/bin/env node

import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';

async function createTestData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🚀 Создание тестовых данных...');

    // Хэшируем пароль
    const hashedPassword = bcrypt.hashSync('teacher', 10);

    // Создаем пользователя teacher с ролью instructor
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
    console.log(`✅ Создан пользователь: ${userResult.rows[0].username} (ID: ${teacherId}, роль: ${userResult.rows[0].role})`);

    // Создаем тестовый курс
    const courseResult = await pool.query(`
      INSERT INTO courses (title, description, instructor_id, status, is_public, allow_registration)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
      RETURNING id, title
    `, [
      '🎓 Основы программирования',
      'Полный курс по основам программирования для начинающих. Изучите переменные, циклы, функции и объектно-ориентированное программирование.',
      teacherId,
      'published',
      true,
      true
    ]);

    if (courseResult.rows.length > 0) {
      const courseId = courseResult.rows[0].id;
      console.log(`✅ Создан курс: ${courseResult.rows[0].title} (ID: ${courseId})`);

      // Создаем главы курса
      const chapters = [
        { title: '📚 Введение в программирование', order: 1 },
        { title: '🔤 Переменные и типы данных', order: 2 },
        { title: '🔄 Циклы и условия', order: 3 },
        { title: '⚙️ Функции', order: 4 },
        { title: '🏗️ Объектно-ориентированное программирование', order: 5 }
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
          console.log(`  ✅ Создана глава: ${chapterResult.rows[0].title}`);

          // Создаем уроки для каждой главы
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
              console.log(`    ✅ Создан урок: ${lessonResult.rows[0].title}`);
            }
          }
        }
      }
    } else {
      console.log('ℹ️ Курс уже существует, пропускаем создание');
    }

    console.log('🎉 Тестовые данные успешно созданы!');
    console.log('');
    console.log('📋 Данные для входа:');
    console.log('   Логин: teacher');
    console.log('   Пароль: teacher');
    console.log('   Роль: instructor');

  } catch (error) {
    console.error('❌ Ошибка при создании тестовых данных:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

function getLessonsForChapter(chapterOrder) {
  const lessonsMap = {
    1: [ // Введение в программирование
      {
        title: 'Что такое программирование?',
        content: '# Что такое программирование?\n\nПрограммирование - это процесс создания инструкций для компьютера. В этом уроке мы изучим основные концепции и термины.'
      },
      {
        title: 'История развития языков программирования',
        content: '# История развития языков программирования\n\nОт машинного кода до современных высокоуровневых языков - путешествие через историю программирования.'
      }
    ],
    2: [ // Переменные и типы данных
      {
        title: 'Переменные: что это и зачем нужны',
        content: '# Переменные\n\nПеременные - это контейнеры для хранения данных. Изучим как их создавать и использовать.\n\n```javascript\nlet name = "Иван";\nlet age = 25;\nconsole.log(name, age);\n```'
      },
      {
        title: 'Типы данных: числа, строки, булевы значения',
        content: '# Типы данных\n\nОсновные типы данных в программировании:\n\n- **Числа**: 42, 3.14\n- **Строки**: "Привет, мир!"\n- **Булевы**: true, false'
      }
    ],
    3: [ // Циклы и условия
      {
        title: 'Условные конструкции if/else',
        content: '# Условные конструкции\n\nУсловия позволяют программе принимать решения:\n\n```javascript\nif (age >= 18) {\n  console.log("Совершеннолетний");\n} else {\n  console.log("Несовершеннолетний");\n}\n```'
      },
      {
        title: 'Циклы: for и while',
        content: '# Циклы\n\nЦиклы позволяют повторять код:\n\n```javascript\n// Цикл for\nfor (let i = 0; i < 5; i++) {\n  console.log(i);\n}\n\n// Цикл while\nlet count = 0;\nwhile (count < 3) {\n  console.log(count);\n  count++;\n}\n```'
      }
    ],
    4: [ // Функции
      {
        title: 'Создание и вызов функций',
        content: '# Функции\n\nФункции - это блоки кода, которые можно переиспользовать:\n\n```javascript\nfunction greet(name) {\n  return "Привет, " + name + "!";\n}\n\nconsole.log(greet("Анна"));\n```'
      },
      {
        title: 'Параметры и возвращаемые значения',
        content: '# Параметры и возвращаемые значения\n\nФункции могут принимать параметры и возвращать результат:\n\n```javascript\nfunction add(a, b) {\n  return a + b;\n}\n\nlet result = add(5, 3);\nconsole.log(result); // 8\n```'
      }
    ],
    5: [ // ООП
      {
        title: 'Основы объектно-ориентированного программирования',
        content: '# ООП: Основы\n\nОбъектно-ориентированное программирование (ООП) - это парадигма программирования, основанная на концепции объектов.\n\n## Основные принципы:\n- Инкапсуляция\n- Наследование\n- Полиморфизм'
      },
      {
        title: 'Классы и объекты',
        content: '# Классы и объекты\n\nКлассы - это шаблоны для создания объектов:\n\n```javascript\nclass Person {\n  constructor(name, age) {\n    this.name = name;\n    this.age = age;\n  }\n  \n  greet() {\n    return `Привет, меня зовут ${this.name}`;\n  }\n}\n\nlet person = new Person("Петр", 30);\nconsole.log(person.greet());\n```'
      }
    ]
  };

  return lessonsMap[chapterOrder] || [];
}

// Запускаем создание данных
createTestData();