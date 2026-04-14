-- Task: replace date-only dueDate with dueAt (timestamp) + optional expiresAt
ALTER TABLE "Task" RENAME COLUMN "dueDate" TO "dueAt";
ALTER TABLE "Task" ADD COLUMN "expiresAt" TIMESTAMP(3);

-- Task: open-to-all assignment mode
-- When openToAll is true, assignedToId becomes nullable (no single assignee).
-- maxSpots limits how many pledges can claim the task.
ALTER TABLE "Task" ADD COLUMN "openToAll" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Task" ADD COLUMN "maxSpots"  INTEGER;

-- Allow assignedToId to be null for open tasks
ALTER TABLE "Task" ALTER COLUMN "assignedToId" DROP NOT NULL;

-- Junction table for pledges who claimed an open task
CREATE TABLE "TaskClaim" (
    "id"        TEXT NOT NULL,
    "taskId"    TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskClaim_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TaskClaim_taskId_userId_key" UNIQUE ("taskId", "userId")
);

ALTER TABLE "TaskClaim" ADD CONSTRAINT "TaskClaim_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskClaim" ADD CONSTRAINT "TaskClaim_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

GRANT ALL ON "TaskClaim" TO anon, authenticated, service_role;

-- RLS for TaskClaim
ALTER TABLE "TaskClaim" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "taskclaim_select" ON "TaskClaim"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "taskclaim_insert" ON "TaskClaim"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "taskclaim_delete" ON "TaskClaim"
  FOR DELETE TO authenticated USING (true);
