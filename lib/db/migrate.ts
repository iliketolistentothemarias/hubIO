import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { getPool } from './client';

export async function runMigrations() {
  const pool = getPool();
  const migrationsDir = join(process.cwd(), 'lib', 'db', 'postgres-migrations');
  
  try {
    const files = await readdir(migrationsDir);
    const sqlFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${sqlFiles.length} migration files`);

    for (const file of sqlFiles) {
      console.log(`Running migration: ${file}`);
      const filePath = join(migrationsDir, file);
      const sql = await readFile(filePath, 'utf-8');
      
      await pool.query(sql);
      console.log(`✓ Completed migration: ${file}`);
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}
