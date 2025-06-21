-- Initial demo data for production deployment
-- This will run only once when the database is first created

-- Insert teacher user with hashed password (PBKDF2)
INSERT INTO users (username, password, email, role, created_at)
VALUES (
  'teacher',
  '78509d9eaba5a4677c412ec1a06ba37cd8a315386903cb5265fe7ed677c3106a2eef1d7d5e18c34bb4390ab300aa8ebceaae8fd9ed4e14657647816910e17044',
  'teacher@example.com',
  'instructor',
  NOW()
) ON CONFLICT (username) DO NOTHING;

-- Insert demo course
INSERT INTO courses (title, description, instructor_id, status, is_public, allow_registration, created_at)
VALUES (
  '🎯 Complete Web Development Bootcamp',
  'Master web development from scratch! Learn HTML, CSS, JavaScript, and build real projects. Perfect for beginners who want to become professional web developers.',
  (SELECT id FROM users WHERE username = 'teacher' LIMIT 1),
  'published',
  true,
  true,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert system settings
INSERT INTO system_settings (key, value)
VALUES 
  ('allow_student_registration', 'true'),
  ('platform_name', 'Vibe LMS'),
  ('welcome_message', 'Welcome to your learning journey!')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Insert demo chapters
INSERT INTO chapters (title, description, course_id, order_index, created_at)
VALUES 
  ('Getting Started with Web Development', 'Introduction to web development fundamentals and setting up your development environment.', 
   (SELECT id FROM courses WHERE title = '🎯 Complete Web Development Bootcamp' LIMIT 1), 1, NOW()),
  ('HTML Fundamentals', 'Learn the building blocks of web pages with HTML5.',
   (SELECT id FROM courses WHERE title = '🎯 Complete Web Development Bootcamp' LIMIT 1), 2, NOW()),  
  ('CSS Styling', 'Make your websites beautiful with CSS3 and modern styling techniques.',
   (SELECT id FROM courses WHERE title = '🎯 Complete Web Development Bootcamp' LIMIT 1), 3, NOW())
ON CONFLICT DO NOTHING;

-- Insert demo lessons
INSERT INTO lessons (title, description, content, chapter_id, order_index, lesson_type, created_at)
VALUES 
  ('Welcome to Web Development', 'Your journey into web development starts here!', 
   '<h2>Welcome to Web Development!</h2><p>In this course, you''ll learn everything you need to become a professional web developer.</p><p><strong>What you''ll learn:</strong></p><ul><li>HTML5 fundamentals</li><li>CSS3 styling and layouts</li><li>JavaScript programming</li><li>Building real projects</li></ul>',
   (SELECT id FROM chapters WHERE title = 'Getting Started with Web Development' LIMIT 1), 1, 'text', NOW()),
  ('Setting Up Your Development Environment', 'Learn how to set up the tools you need for web development.',
   '<h2>Development Environment Setup</h2><p>Let''s get your computer ready for web development!</p><h3>Tools You''ll Need:</h3><ul><li>Code Editor (VS Code recommended)</li><li>Web Browser (Chrome or Firefox)</li><li>Terminal/Command Line</li></ul><p>Follow along as we install and configure each tool.</p>',
   (SELECT id FROM chapters WHERE title = 'Getting Started with Web Development' LIMIT 1), 2, 'text', NOW()),
  ('Introduction to HTML', 'Learn the basics of HTML markup language.',
   '<h2>What is HTML?</h2><p>HTML (HyperText Markup Language) is the standard markup language for creating web pages.</p><h3>Basic HTML Structure:</h3><pre><code>&lt;!DOCTYPE html&gt;\n&lt;html&gt;\n&lt;head&gt;\n    &lt;title&gt;My First Webpage&lt;/title&gt;\n&lt;/head&gt;\n&lt;body&gt;\n    &lt;h1&gt;Hello World!&lt;/h1&gt;\n&lt;/body&gt;\n&lt;/html&gt;</code></pre>',
   (SELECT id FROM chapters WHERE title = 'HTML Fundamentals' LIMIT 1), 1, 'text', NOW())
ON CONFLICT DO NOTHING;