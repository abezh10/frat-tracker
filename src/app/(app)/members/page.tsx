import { redirect } from "next/navigation";
import { startOfISOWeek, endOfISOWeek } from "date-fns";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { MembersClient } from "@/components/members-client";

export default async function MembersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const supabase = await createClient();

  const [brothersResult, pledgesResult] = await Promise.all([
    supabase
      .from("User")
      .select("id, name, email, phone, role, createdAt")
      .eq("role", "BROTHER")
      .order("name"),
    supabase
      .from("User")
      .select("id, name, email, phone, role, pledgeClass, createdAt")
      .eq("role", "PLEDGE")
      .order("name"),
  ]);

  const brothers = (brothersResult.data ?? []).map(
    (u: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      role: string;
      createdAt: string;
    }) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone ?? "",
      role: u.role,
      createdAt: u.createdAt,
    })
  );

  const pledgeUsers = pledgesResult.data ?? [];
  const pledgeIds = pledgeUsers.map((u: { id: string }) => u.id);

  const now = new Date();
  const weekStart = startOfISOWeek(now);
  const weekEnd = endOfISOWeek(now);

  let allTasks: { assignedToId: string; status: string }[] = [];
  let weeklySigs: { pledgeId: string }[] = [];
  let totalSigs: { pledgeId: string }[] = [];

  if (pledgeIds.length > 0) {
    const [tasksResult, weeklyResult, totalResult] = await Promise.all([
      supabase
        .from("Task")
        .select("assignedToId, status")
        .in("assignedToId", pledgeIds),
      supabase
        .from("Signature")
        .select("pledgeId")
        .in("pledgeId", pledgeIds)
        .gte("createdAt", weekStart.toISOString())
        .lte("createdAt", weekEnd.toISOString()),
      supabase
        .from("Signature")
        .select("pledgeId")
        .in("pledgeId", pledgeIds),
    ]);

    allTasks = tasksResult.data ?? [];
    weeklySigs = weeklyResult.data ?? [];
    totalSigs = totalResult.data ?? [];
  }

  const taskStatsByPledge = new Map<
    string,
    { total: number; completed: number }
  >();
  for (const task of allTasks) {
    const existing = taskStatsByPledge.get(task.assignedToId) ?? {
      total: 0,
      completed: 0,
    };
    existing.total += 1;
    if (task.status === "COMPLETED") {
      existing.completed += 1;
    }
    taskStatsByPledge.set(task.assignedToId, existing);
  }

  const weeklyByPledge = new Map<string, number>();
  for (const sig of weeklySigs) {
    weeklyByPledge.set(
      sig.pledgeId,
      (weeklyByPledge.get(sig.pledgeId) ?? 0) + 1
    );
  }

  const totalByPledge = new Map<string, number>();
  for (const sig of totalSigs) {
    totalByPledge.set(
      sig.pledgeId,
      (totalByPledge.get(sig.pledgeId) ?? 0) + 1
    );
  }

  const pledges = pledgeUsers.map(
    (u: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      role: string;
      pledgeClass: string | null;
      createdAt: string;
    }) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone ?? "",
      role: u.role,
      pledgeClass: u.pledgeClass,
      createdAt: u.createdAt,
      taskStats: taskStatsByPledge.get(u.id) ?? { total: 0, completed: 0 },
      weeklySignatures: weeklyByPledge.get(u.id) ?? 0,
      totalSignatures: totalByPledge.get(u.id) ?? 0,
    })
  );

  return (
    <>
      <Header title="Members" />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <MembersClient
          brothers={brothers}
          pledges={pledges}
          currentUser={{
            id: currentUser.id,
            name: currentUser.name,
            role: currentUser.role,
          }}
        />
      </div>
    </>
  );
}
