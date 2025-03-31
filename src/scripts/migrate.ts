import { runMigrations } from '@/lib/migrations';

async function migrate() {
  try {
    await runMigrations();
    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();