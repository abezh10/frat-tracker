import { redirect } from "next/navigation";
import { startOfISOWeek, endOfISOWeek } from "date-fns";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const now = new Date();
  const weekStart = startOfISOWeek(now);
  const weekEnd = endOfISOWeek(now);

  const taskWhere =
    user.role === "PLEDGE"
      ? { assignedToId: user.id, status: "PENDING" }
      : { status: "PENDING" };

  const [
    pendingTasks,
    upcomingEvents,
    weeklySignatureCounts,
    totalPledges,
    recentTasks,
    recentSignatures,
    recentEvents,
  ] = await Promise.all([
    prisma.task.count({ where: taskWhere }),
    prisma.event.count({ where: { date: { gt: now } } }),
    prisma.signature.groupBy({
      by: ["pledgeId"],
      where: { createdAt: { gte: weekStart, lte: weekEnd } },
      _count: { id: true },
    }),
    prisma.user.count({ where: { role: "PLEDGE" } }),
    prisma.task.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        assignedTo: { select: { name: true } },
        assignedBy: { select: { name: true } },
      },
    }),
    prisma.signature.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        pledge: { select: { name: true } },
        brother: { select: { name: true } },
        event: { select: { title: true } },
      },
    }),
    prisma.event.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true } } },
    }),
  ]);

  const pledgeMap = await prisma.user.findMany({
    where: { role: "PLEDGE" },
    select: { id: true, name: true },
  });
  const pledgeNameMap = new Map(pledgeMap.map((p) => [p.id, p.name]));

  const weeklyLeaderboard = weeklySignatureCounts
    .map((entry) => ({
      pledge: {
        id: entry.pledgeId,
        name: pledgeNameMap.get(entry.pledgeId) ?? "Unknown",
      },
      count: entry._count.id,
    }))
    .sort((a, b) => b.count - a.count);

  const totalSignaturesThisWeek = weeklyLeaderboard.reduce(
    (sum, entry) => sum + entry.count,
    0
  );

  const recentActivity = [
    ...recentTasks.map((task) => ({
      type: "task" as const,
      title: task.title,
      description: `Assigned to ${task.assignedTo.name} by ${task.assignedBy.name}`,
      createdAt: task.createdAt.toISOString(),
    })),
    ...recentSignatures.map((sig) => ({
      type: "signature" as const,
      title: `Signature from ${sig.brother.name}`,
      description: `${sig.pledge.name} at ${sig.event.title}`,
      createdAt: sig.createdAt.toISOString(),
    })),
    ...recentEvents.map((event) => ({
      type: "event" as const,
      title: event.title,
      description: `Created by ${event.createdBy.name}${event.location ? ` · ${event.location}` : ""}`,
      createdAt: event.createdAt.toISOString(),
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 15);

  return (
    <>
      <Header title="Dashboard" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <DashboardClient
          currentUser={{ id: user.id, name: user.name, role: user.role }}
          stats={{
            pendingTasks,
            upcomingEvents,
            totalSignaturesThisWeek,
            totalPledges,
          }}
          weeklyLeaderboard={weeklyLeaderboard}
          recentActivity={recentActivity}
        />
      </div>
    </>
  );
}
