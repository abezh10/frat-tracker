import { redirect } from "next/navigation";
import { startOfISOWeek } from "date-fns";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { WeeklySignaturesClient } from "@/components/weekly-signatures-client";

function getWeekRange(isoWeek: string) {
  const [yearStr, weekStr] = isoWeek.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);
  const jan4 = new Date(year, 0, 4);
  const startOfWeek1 = startOfISOWeek(jan4);
  const weekStart = new Date(startOfWeek1);
  weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return { start: weekStart, end: weekEnd };
}

function getCurrentISOWeek(): string {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const start = startOfISOWeek(jan4);
  const diff = now.getTime() - start.getTime();
  const weekNum = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export default async function SignaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const currentWeek =
    typeof params.week === "string" ? params.week : getCurrentISOWeek();

  const { start: weekStart, end: weekEnd } = getWeekRange(currentWeek);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const [
    pledges,
    currentWeekCounts,
    lastWeekCounts,
    cumulativeCounts,
    weekSignatures,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { role: "PLEDGE" },
      select: { id: true, name: true, pledgeClass: true },
      orderBy: { name: "asc" },
    }),
    prisma.signature.groupBy({
      by: ["pledgeId"],
      where: { createdAt: { gte: weekStart, lt: weekEnd } },
      _count: { id: true },
    }),
    prisma.signature.groupBy({
      by: ["pledgeId"],
      where: { createdAt: { gte: prevWeekStart, lt: weekStart } },
      _count: { id: true },
    }),
    prisma.signature.groupBy({
      by: ["pledgeId"],
      _count: { id: true },
    }),
    prisma.signature.findMany({
      where: { createdAt: { gte: weekStart, lt: weekEnd } },
      include: {
        brother: { select: { name: true } },
        event: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const currentMap = new Map(
    currentWeekCounts.map((c) => [c.pledgeId, c._count.id])
  );
  const lastMap = new Map(
    lastWeekCounts.map((c) => [c.pledgeId, c._count.id])
  );
  const cumulativeMap = new Map(
    cumulativeCounts.map((c) => [c.pledgeId, c._count.id])
  );

  const sigsByPledge: Record<string, typeof weekSignatures> = {};
  for (const sig of weekSignatures) {
    if (!sigsByPledge[sig.pledgeId]) sigsByPledge[sig.pledgeId] = [];
    sigsByPledge[sig.pledgeId].push(sig);
  }

  const pledgeData = pledges.map((pledge) => ({
    pledge: {
      id: pledge.id,
      name: pledge.name,
      pledgeClass: pledge.pledgeClass,
    },
    thisWeekCount: currentMap.get(pledge.id) ?? 0,
    lastWeekCount: lastMap.get(pledge.id) ?? 0,
    cumulativeTotal: cumulativeMap.get(pledge.id) ?? 0,
    signatures: (sigsByPledge[pledge.id] ?? []).map((sig) => ({
      id: sig.id,
      brother: { name: sig.brother.name },
      event: { title: sig.event.title },
      createdAt: sig.createdAt.toISOString(),
    })),
  }));

  return (
    <>
      <Header title="Weekly Signatures" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <WeeklySignaturesClient
          currentWeek={currentWeek}
          pledgeData={pledgeData}
          currentUser={{ id: user.id, name: user.name, role: user.role }}
        />
      </div>
    </>
  );
}
