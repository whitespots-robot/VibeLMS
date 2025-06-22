/**
 * Simple user creation script for Docker containers
 * Usage: node createuser.js username email password role
 */

const crypto = require('crypto');
const { Pool } = require('@neondatabase/serverless');

async function createUser() {
  try {
    const [username, email, password, role = 'student'] = process.argv.slice(2);
    
    if (!username || !email || !password) {
      console.log('Usage: node createuser.js <username> <email> <password> [role]');
      console.log('Role defaults to "student", can be "instructor"');
      process.exit(1);
    }

    if (!['student', 'instructor'].includes(role)) {
      console.error('Error: Role must be either "student" or "instructor"');
      process.exit(1);
    }

    if (!process.env.DATABASE_URL) {
      console.error('Error: DATABASE_URL environment variable is not set');
      process.exit(1);
    }
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Check if username already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      console.error(`Error: User with username "${username}" already exists`);
      process.exit(1);
    }

    // Hash password
    const salt = 'vibelms_salt_2024';
    const hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

    // Create user
    const result = await pool.query(`
      INSERT INTO users (username, password, email, role, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, username, email, role, created_at
    `, [username, hashedPassword, email, role]);

    const newUser = result.rows[0];
    
    console.log('✓ User created successfully!');
    console.log(`ID: ${newUser.id}`);
    console.log(`Username: ${newUser.username}`);
    console.log(`Email: ${newUser.email}`);
    console.log(`Role: ${newUser.role}`);

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('✗ Error creating user:', error.message);
    process.exit(1);
  }
}

createUser();