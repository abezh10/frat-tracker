import { startOfISOWeek, endOfISOWeek } from "date-fns";
import { CheckSquare, Calendar, PenTool, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";

interface StatCardsProps {
  user: { id: string; role: string };
}

export async function DashboardStatCards({ user }: StatCardsProps) {
  const supabase = await createClient();
  const now = new Date();
  const weekStart = startOfISOWeek(now);
  const weekEnd = endOfISOWeek(now);
  const isBrother = user.role === "BROTHER" || user.role === "ADMIN";

  const pendingTasksQuery =
    user.role === "PLEDGE"
      ? supabase
          .from("Task")
          .select("*", { count: "exact", head: true })
          .eq("status", "PENDING")
          .eq("assignedToId", user.id)
      : supabase
          .from("Task")
          .select("*", { count: "exact", head: true })
          .eq("status", "PENDING");

  const fourthStatQuery = isBrother
    ? supabase
        .from("User")
        .select("*", { count: "exact", head: true })
        .eq("role", "PLEDGE")
    : supabase
        .from("Signature")
        .select("*", { count: "exact", head: true })
        .eq("pledgeId", user.id)
        .gte("createdAt", weekStart.toISOString())
        .lte("createdAt", weekEnd.toISOString());

  const [
    pendingTasksResult,
    upcomingEventsResult,
    weeklySignaturesResult,
    fourthStatResult,
  ] = await Promise.all([
    pendingTasksQuery,
    supabase
      .from("Event")
      .select("*", { count: "exact", head: true })
      .gt("date", now.toISOString()),
    supabase
      .from("Signature")
      .select("*", { count: "exact", head: true })
      .gte("createdAt", weekStart.toISOString())
      .lte("createdAt", weekEnd.toISOString()),
    fourthStatQuery,
  ]);

  const statCards = [
    {
      label: "Pending Tasks",
      value: pendingTasksResult.count ?? 0,
      icon: CheckSquare,
      color: "text-amber-300",
      bg: "bg-amber-500/10 ring-1 ring-inset ring-amber-400/20",
    },
    {
      label: "Upcoming Events",
      value: upcomingEventsResult.count ?? 0,
      icon: Calendar,
      color: "text-primary",
      bg: "bg-primary/10 ring-1 ring-inset ring-primary/25",
    },
    {
      label: "Signatures This Week",
      value: weeklySignaturesResult.count ?? 0,
      icon: PenTool,
      color: "text-cyan-300",
      bg: "bg-cyan-500/10 ring-1 ring-inset ring-cyan-400/25",
    },
    {
      label: isBrother ? "Total Pledges" : "Your Signatures",
      value: fourthStatResult.count ?? 0,
      icon: isBrother ? Users : PenTool,
      color: "text-fuchsia-300",
      bg: "bg-fuchsia-500/10 ring-1 ring-inset ring-fuchsia-400/20",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card
          key={stat.label}
          className="group relative overflow-hidden border-border/60 bg-card/40 backdrop-blur-xl transition-all hover:border-primary/30 hover:shadow-[0_0_0_1px_var(--color-primary)/15,0_20px_60px_-30px_var(--rail-glow)]"
        >
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {stat.label}
            </CardDescription>
            <div className={`rounded-md p-2 ${stat.bg}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-foreground">
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DashboardStatCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  );
}
