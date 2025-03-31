import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';

interface Migration {
  up: () => Promise<void>;
  down: () => Promise<void>;
}

export async function runMigrations() {
  // Create migrations table if it doesn't exist
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(255) PRIMARY KEY,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Get all migration files
  const migrationsDir = path.join(process.cwd(), 'src', 'lib', 'migrations');
  const files = await fs.readdir(migrationsDir);
  const migrationFiles = files.filter(f => 
    f.endsWith('.ts') && 
    !f.endsWith('.d.ts') && 
    f !== 'index.ts'
  );

  // Get executed migrations
  const [rows] = await pool.query('SELECT id FROM migrations');
  const executedMigrations = new Set((rows as any[]).map(r => r.id));

  // Run pending migrations
  for (const file of migrationFiles) {
    if (!executedMigrations.has(file)) {
      console.log(`Running migration: ${file}`);
      const migration = require(path.join(migrationsDir, file)) as Migration;
      
      try {
        await migration.up();
        await pool.query('INSERT INTO migrations (id) VALUES (?)', [file]);
        console.log(`Migration ${file} executed successfully`);
      } catch (error) {
        console.error(`Failed to run migration ${file}:`, error);
        throw error;
      }
    }
  }

  await pool.end();
}