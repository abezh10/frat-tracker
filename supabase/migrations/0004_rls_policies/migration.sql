-- Re-enable RLS on all tables
ALTER TABLE "User"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Signature" ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- User table
-- ═══════════════════════════════════════════════════════════

-- Authenticated users can read all members
CREATE POLICY "users_select" ON "User"
  FOR SELECT TO authenticated
  USING (true);

-- Newly authenticated users can insert their own profile (authId must match)
CREATE POLICY "users_insert_own" ON "User"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = "authId");

-- Users can update their own profile
CREATE POLICY "users_update_own" ON "User"
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = "authId")
  WITH CHECK (auth.uid()::text = "authId");

-- ═══════════════════════════════════════════════════════════
-- Task table
-- ═══════════════════════════════════════════════════════════

-- Authenticated users can read all tasks
CREATE POLICY "tasks_select" ON "Task"
  FOR SELECT TO authenticated
  USING (true);

-- Authenticated users can create tasks
CREATE POLICY "tasks_insert" ON "Task"
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Authenticated users can update any task
CREATE POLICY "tasks_update" ON "Task"
  FOR UPDATE TO authenticated
  USING (true);

-- Authenticated users can delete tasks
CREATE POLICY "tasks_delete" ON "Task"
  FOR DELETE TO authenticated
  USING (true);

-- ═══════════════════════════════════════════════════════════
-- Event table
-- ═══════════════════════════════════════════════════════════

-- Authenticated users can read all events
CREATE POLICY "events_select" ON "Event"
  FOR SELECT TO authenticated
  USING (true);

-- Authenticated users can create events
CREATE POLICY "events_insert" ON "Event"
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Authenticated users can update events
CREATE POLICY "events_update" ON "Event"
  FOR UPDATE TO authenticated
  USING (true);

-- Authenticated users can delete events
CREATE POLICY "events_delete" ON "Event"
  FOR DELETE TO authenticated
  USING (true);

-- ═══════════════════════════════════════════════════════════
-- Signature table
-- ═══════════════════════════════════════════════════════════

-- Authenticated users can read all signatures
CREATE POLICY "signatures_select" ON "Signature"
  FOR SELECT TO authenticated
  USING (true);

-- Authenticated users can create signatures
CREATE POLICY "signatures_insert" ON "Signature"
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Authenticated users can delete signatures
CREATE POLICY "signatures_delete" ON "Signature"
  FOR DELETE TO authenticated
  USING (true);
