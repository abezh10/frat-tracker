import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { TasksClient } from "@/components/tasks-client";

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  let tasksQuery = supabase
    .from("Task")
    .select(
      "*, assignedTo:User!Task_assignedToId_fkey(id, name), assignedBy:User!Task_assignedById_fkey(id, name), claims:TaskClaim(id, userId, claimedAt, user:User!TaskClaim_userId_fkey(id, name))"
    )
    .order("createdAt", { ascending: false });

  if (user.role === "PLEDGE") {
    tasksQuery = tasksQuery.or(`assignedToId.eq.${user.id},openToAll.eq.true`);
  }

  const [tasksResult, pledgesResult] = await Promise.all([
    tasksQuery,
    supabase
      .from("User")
      .select("id, name")
      .eq("role", "PLEDGE")
      .order("name"),
  ]);

  const tasks = tasksResult.data ?? [];
  const pledges = pledgesResult.data ?? [];

  return (
    <>
      <Header title="Tasks" />
      <div className="flex-1 p-4 md:p-6">
        <TasksClient
          tasks={tasks}
          currentUser={{ id: user.id, name: user.name, role: user.role }}
          pledges={pledges}
        />
      </div>
    </>
  );
}
