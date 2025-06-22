import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with flexible SSL configuration
const createPool = () => {
  const connectionString = process.env.DATABASE_URL!;
  
  // Try without SSL first for better compatibility
  const pool = new Pool({ 
    connectionString,
    ssl: false
  });
  
  // Handle SSL connection errors gracefully
  pool.on('error', (err) => {
    console.error('Database pool error:', err);
  });
  
  return pool;
};

export const pool = createPool();
export const db = drizzle(pool, { schema });