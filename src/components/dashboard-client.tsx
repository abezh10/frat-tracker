"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  CheckSquare,
  Calendar,
  PenTool,
  Users,
  Trophy,
  ArrowRight,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DashboardClientProps {
  currentUser: { id: string; name: string; role: string };
  stats: {
    pendingTasks: number;
    upcomingEvents: number;
    totalSignaturesThisWeek: number;
    totalPledges: number;
  };
  weeklyLeaderboard: Array<{
    pledge: { id: string; name: string };
    count: number;
  }>;
  recentActivity: Array<{
    type: "task" | "event" | "signature";
    title: string;
    description: string;
    createdAt: string;
  }>;
}

const RANK_STYLES = [
  { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", border: "border-amber-300 dark:border-amber-700", badge: "bg-amber-500", label: "1st" },
  { bg: "bg-zinc-100 dark:bg-zinc-800/50", text: "text-zinc-600 dark:text-zinc-300", border: "border-zinc-300 dark:border-zinc-600", badge: "bg-zinc-400", label: "2nd" },
  { bg: "bg-orange-100 dark:bg-orange-900/20", text: "text-orange-700 dark:text-orange-400", border: "border-orange-300 dark:border-orange-700", badge: "bg-orange-600", label: "3rd" },
] as const;

function getActivityIcon(type: "task" | "event" | "signature") {
  switch (type) {
    case "task":
      return <CheckSquare className="h-4 w-4 text-amber-500" />;
    case "event":
      return <Calendar className="h-4 w-4 text-blue-500" />;
    case "signature":
      return <PenTool className="h-4 w-4 text-green-500" />;
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function DashboardClient({
  currentUser,
  stats,
  weeklyLeaderboard,
  recentActivity,
}: DashboardClientProps) {
  const isBrother = currentUser.role === "BROTHER";
  const maxCount = weeklyLeaderboard[0]?.count ?? 1;

  const roleGreeting = isBrother
    ? "Here's what's happening with the pledge class."
    : "Here's your progress this week.";

  const statCards = [
    {
      label: "Pending Tasks",
      value: stats.pendingTasks,
      icon: CheckSquare,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      label: "Upcoming Events",
      value: stats.upcomingEvents,
      icon: Calendar,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Signatures This Week",
      value: stats.totalSignaturesThisWeek,
      icon: PenTool,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950/30",
    },
    {
      label: isBrother ? "Total Pledges" : "Your Signatures",
      value: isBrother
        ? stats.totalPledges
        : weeklyLeaderboard.find((e) => e.pledge.id === currentUser.id)
            ?.count ?? 0,
      icon: isBrother ? Users : PenTool,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome back, {currentUser.name}
        </h2>
        <p className="text-muted-foreground">{roleGreeting}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                {stat.label}
              </CardDescription>
              <div className={`rounded-md p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content: Leaderboard + Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Leaderboard */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <CardTitle>Weekly Signature Leaderboard</CardTitle>
            </div>
            <CardDescription>
              Pledge rankings by signatures collected this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyLeaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No signatures recorded this week yet.
              </p>
            ) : (
              <div className="space-y-3">
                {weeklyLeaderboard.map((entry, index) => {
                  const rankStyle = index < 3 ? RANK_STYLES[index] : null;
                  const barWidth =
                    maxCount > 0
                      ? Math.max((entry.count / maxCount) * 100, 4)
                      : 4;

                  return (
                    <div
                      key={entry.pledge.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                        rankStyle
                          ? `${rankStyle.bg} ${rankStyle.border}`
                          : "border-border"
                      }`}
                    >
                      {/* Rank */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                        {rankStyle ? (
                          <Badge
                            className={`${rankStyle.badge} text-white text-xs px-2`}
                          >
                            {rankStyle.label}
                          </Badge>
                        ) : (
                          <span className="text-sm font-medium text-muted-foreground">
                            #{index + 1}
                          </span>
                        )}
                      </div>

                      {/* Avatar + Name */}
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(entry.pledge.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-sm font-medium truncate ${
                              rankStyle ? rankStyle.text : ""
                            }`}
                          >
                            {entry.pledge.name}
                          </span>
                          <span className="text-sm font-bold tabular-nums ml-2">
                            {entry.count}
                          </span>
                        </div>
                        {/* Bar */}
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              index === 0
                                ? "bg-amber-500"
                                : index === 1
                                  ? "bg-zinc-400"
                                  : index === 2
                                    ? "bg-orange-500"
                                    : "bg-primary/40"
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Separator className="my-4" />
            <Link
              href="/signatures"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View full details
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Recent Activity</CardTitle>
            </div>
            <CardDescription>Latest updates across the chapter</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No recent activity.
              </p>
            ) : (
              <div className="relative space-y-0">
                {recentActivity.map((activity, index) => (
                  <div key={`${activity.type}-${activity.createdAt}-${index}`} className="relative flex gap-3 pb-6 last:pb-0">
                    {/* Timeline line */}
                    {index < recentActivity.length - 1 && (
                      <div className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-border" />
                    )}

                    {/* Icon */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
                      {getActivityIcon(activity.type)}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-sm font-medium leading-tight truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(activity.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
