/**
 * @deprecated Migrations are now handled via Supabase MCP server.
 * Use mcp_supabase_apply_migration instead of this function.
 * 
 * This file is kept for reference but should not be used for new migrations.
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

/**
 * @deprecated Use Supabase MCP server migrations instead
 * All migrations have been applied to Supabase via MCP.
 * Future migrations should use mcp_supabase_apply_migration.
 */
export async function runMigrations() {
  console.warn(
    'runMigrations() is deprecated. ' +
    'All migrations have been applied to Supabase via MCP server. ' +
    'Future migrations should use mcp_supabase_apply_migration.'
  );
  
  // Migrations are now managed through Supabase MCP
  // See lib/db/migrations/ for SQL files that have been applied
  console.log('Migrations are managed via Supabase MCP server.');
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
