import { redirect } from "next/navigation";
import { startOfISOWeek, endOfISOWeek } from "date-fns";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { MembersClient } from "@/components/members-client";

export default async function MembersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const allUsers = await prisma.user.findMany({
    orderBy: { name: "asc" },
  });

  const brothers = allUsers
    .filter((u) => u.role === "BROTHER")
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    }));

  const pledgeUsers = allUsers.filter((u) => u.role === "PLEDGE");
  const pledgeIds = pledgeUsers.map((u) => u.id);

  const now = new Date();
  const weekStart = startOfISOWeek(now);
  const weekEnd = endOfISOWeek(now);

  const [tasks, weeklySignatures, totalSignatures] = await Promise.all([
    prisma.task.groupBy({
      by: ["assignedToId", "status"],
      where: { assignedToId: { in: pledgeIds } },
      _count: { id: true },
    }),
    prisma.signature.groupBy({
      by: ["pledgeId"],
      where: {
        pledgeId: { in: pledgeIds },
        createdAt: { gte: weekStart, lte: weekEnd },
      },
      _count: { id: true },
    }),
    prisma.signature.groupBy({
      by: ["pledgeId"],
      where: { pledgeId: { in: pledgeIds } },
      _count: { id: true },
    }),
  ]);

  const taskStatsByPledge = new Map<
    string,
    { total: number; completed: number }
  >();
  for (const row of tasks) {
    const existing = taskStatsByPledge.get(row.assignedToId) ?? {
      total: 0,
      completed: 0,
    };
    existing.total += row._count.id;
    if (row.status === "COMPLETED") {
      existing.completed += row._count.id;
    }
    taskStatsByPledge.set(row.assignedToId, existing);
  }

  const weeklyByPledge = new Map(
    weeklySignatures.map((r) => [r.pledgeId, r._count.id])
  );
  const totalByPledge = new Map(
    totalSignatures.map((r) => [r.pledgeId, r._count.id])
  );

  const pledges = pledgeUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    pledgeClass: u.pledgeClass,
    createdAt: u.createdAt.toISOString(),
    taskStats: taskStatsByPledge.get(u.id) ?? { total: 0, completed: 0 },
    weeklySignatures: weeklyByPledge.get(u.id) ?? 0,
    totalSignatures: totalByPledge.get(u.id) ?? 0,
  }));

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
