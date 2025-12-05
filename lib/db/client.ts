/**
 * @deprecated This file is deprecated. Use @/lib/supabase/client and @/lib/supabase/database instead.
 * This file is kept for backward compatibility during migration.
 */

import { supabase } from '@/lib/supabase/client';
import { QueryResult, QueryResultRow } from 'pg';

/**
 * @deprecated Use Supabase client directly instead
 * This function is kept for backward compatibility
 */
export function getPool(): any {
  console.warn('getPool() is deprecated. Use Supabase client directly.');
  return null;
}

/**
 * @deprecated Use Supabase queries directly instead
 * This function attempts to convert SQL queries to Supabase format but is not fully compatible.
 * Please migrate to using SupabaseDatabase from @/lib/supabase/database
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  console.warn('query() is deprecated. Use SupabaseDatabase from @/lib/supabase/database instead.');
  
  // This is a basic fallback - for full migration, use SupabaseDatabase
  throw new Error(
    'Direct SQL queries are no longer supported. ' +
    'Please use SupabaseDatabase from @/lib/supabase/database or supabase client from @/lib/supabase/client'
  );
}

/**
 * @deprecated No longer needed with Supabase
 */
export async function closePool(): Promise<void> {
  // No-op for Supabase
}
