#!/usr/bin/env node

/**
 * User creation script for Vibe LMS
 * Usage: npx tsx scripts/createuser.js
 * Similar to Django's manage.py createuser command
 */

import readline from 'readline';
import crypto from 'crypto';
import { Pool } from '@neondatabase/serverless';

// Import database connection
async function createUser() {
  try {
    // Use DATABASE_URL directly from environment
    if (!process.env.DATABASE_URL) {
      console.error('Error: DATABASE_URL environment variable is not set');
      process.exit(1);
    }
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('Creating new user for Vibe LMS\n');

    // Prompt for username
    const username = await new Promise((resolve) => {
      rl.question('Username: ', resolve);
    });

    if (!username.trim()) {
      console.error('Error: Username cannot be empty');
      rl.close();
      process.exit(1);
    }

    // Check if username already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      console.error(`Error: User with username "${username}" already exists`);
      rl.close();
      process.exit(1);
    }

    // Prompt for email
    const email = await new Promise((resolve) => {
      rl.question('Email address: ', resolve);
    });

    if (!email.trim()) {
      console.error('Error: Email cannot be empty');
      rl.close();
      process.exit(1);
    }

    // Prompt for password
    const password = await new Promise((resolve) => {
      rl.question('Password: ', resolve);
    });

    if (!password.trim()) {
      console.error('Error: Password cannot be empty');
      rl.close();
      process.exit(1);
    }

    // Prompt for role
    const role = await new Promise((resolve) => {
      rl.question('Role (student/instructor) [student]: ', (answer) => {
        resolve(answer.trim() || 'student');
      });
    });

    if (!['student', 'instructor'].includes(role)) {
      console.error('Error: Role must be either "student" or "instructor"');
      rl.close();
      process.exit(1);
    }

    rl.close();

    // Hash password using the same method as the application
    const salt = 'vibelms_salt_2024';
    const hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

    // Create user in database
    const result = await pool.query(`
      INSERT INTO users (username, password, email, role, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, username, email, role, created_at
    `, [username, hashedPassword, email, role]);

    const newUser = result.rows[0];
    
    console.log('\n✓ User created successfully!');
    console.log(`ID: ${newUser.id}`);
    console.log(`Username: ${newUser.username}`);
    console.log(`Email: ${newUser.email}`);
    console.log(`Role: ${newUser.role}`);
    console.log(`Created: ${newUser.created_at}`);

    process.exit(0);

  } catch (error) {
    console.error('\n✗ Error creating user:', error.message);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\nOperation cancelled by user');
  process.exit(0);
});

// Run the script
createUser();