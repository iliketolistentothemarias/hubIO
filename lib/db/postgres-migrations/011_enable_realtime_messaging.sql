-- Enable Supabase Realtime (postgres_changes) for messaging-related tables.
-- Tables must be part of publication supabase_realtime. Idempotent: safe to re-run.
-- Apply via: Supabase Dashboard → SQL Editor, or `supabase db push` / MCP apply_migration when connected.

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'messages',
    'conversations',
    'typing_indicators',
    'user_presence',
    'conversation_participants',
    'conversation_metadata',
    'message_reads',
    'message_status',
    'notifications'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = tbl
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
      END IF;
      EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', tbl);
    END IF;
  END LOOP;
END $$;
