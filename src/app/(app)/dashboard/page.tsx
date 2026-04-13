import { Suspense } from "react";
import { redirect } from "next/navigation";

import { Header } from "@/components/header";
import {
  DashboardActivity,
  DashboardActivitySkeleton,
} from "@/components/dashboard-activity";
import {
  DashboardLeaderboard,
  DashboardLeaderboardSkeleton,
} from "@/components/dashboard-leaderboard";
import {
  DashboardStatCards,
  DashboardStatCardsSkeleton,
} from "@/components/dashboard-stat-cards";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isBrother = user.role === "BROTHER" || user.role === "ADMIN";
  const roleGreeting = isBrother
    ? "Here's what's happening with the pledge class."
    : "Here's your progress this week.";

  return (
    <>
      <Header title="Dashboard" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground/80">
            Overview
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Welcome back, {user.name.split(" ")[0]}
          </h2>
          <p className="text-sm text-muted-foreground">{roleGreeting}</p>
        </div>

        <Suspense fallback={<DashboardStatCardsSkeleton />}>
          <DashboardStatCards user={{ id: user.id, role: user.role }} />
        </Suspense>

        <div className="grid gap-6 lg:grid-cols-3">
          <Suspense fallback={<DashboardLeaderboardSkeleton />}>
            <DashboardLeaderboard />
          </Suspense>
          <Suspense fallback={<DashboardActivitySkeleton />}>
            <DashboardActivity />
          </Suspense>
        </div>
      </div>
    </>
  );
}
