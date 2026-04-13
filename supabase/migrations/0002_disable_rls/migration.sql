-- PostgREST uses the anon / authenticated roles. If RLS is ON with no policies,
-- every INSERT/SELECT fails even when GRANT ALL is set.
-- This app expects full access via the Supabase client (no per-row policies).

ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Signature" DISABLE ROW LEVEL SECURITY;
