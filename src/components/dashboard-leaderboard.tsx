import Link from "next/link";
import { startOfISOWeek, endOfISOWeek } from "date-fns";
import { ArrowRight, Trophy } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";

const RANK_STYLES = [
  {
    ring: "ring-amber-400/40",
    bg: "bg-amber-500/5",
    text: "text-amber-300",
    bar: "bg-gradient-to-r from-amber-400 to-amber-500",
    badge: "bg-amber-500/20 text-amber-300 ring-1 ring-inset ring-amber-400/40",
    label: "1st",
  },
  {
    ring: "ring-zinc-400/30",
    bg: "bg-zinc-400/5",
    text: "text-zinc-200",
    bar: "bg-gradient-to-r from-zinc-300 to-zinc-400",
    badge: "bg-zinc-400/15 text-zinc-200 ring-1 ring-inset ring-zinc-300/30",
    label: "2nd",
  },
  {
    ring: "ring-orange-500/30",
    bg: "bg-orange-500/5",
    text: "text-orange-300",
    bar: "bg-gradient-to-r from-orange-500 to-amber-600",
    badge:
      "bg-orange-500/15 text-orange-300 ring-1 ring-inset ring-orange-400/30",
    label: "3rd",
  },
] as const;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export async function DashboardLeaderboard() {
  const supabase = await createClient();
  const now = new Date();
  const weekStart = startOfISOWeek(now);
  const weekEnd = endOfISOWeek(now);

  const [weeklySigsResult, pledgesResult] = await Promise.all([
    supabase
      .from("Signature")
      .select("pledgeId")
      .gte("createdAt", weekStart.toISOString())
      .lte("createdAt", weekEnd.toISOString()),
    supabase.from("User").select("id, name").eq("role", "PLEDGE"),
  ]);

  const pledgeNameMap = new Map(
    (pledgesResult.data ?? []).map((p: { id: string; name: string }) => [
      p.id,
      p.name,
    ])
  );

  const sigCountByPledge = new Map<string, number>();
  for (const sig of weeklySigsResult.data ?? []) {
    sigCountByPledge.set(
      sig.pledgeId,
      (sigCountByPledge.get(sig.pledgeId) ?? 0) + 1
    );
  }

  const weeklyLeaderboard = [...sigCountByPledge.entries()]
    .map(([pledgeId, count]) => ({
      pledge: {
        id: pledgeId,
        name: pledgeNameMap.get(pledgeId) ?? "Unknown",
      },
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const maxCount = weeklyLeaderboard[0]?.count ?? 1;

  return (
    <Card className="border-border/60 bg-card/40 backdrop-blur-xl lg:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 ring-1 ring-inset ring-amber-400/30">
            <Trophy className="h-4 w-4 text-amber-300" />
          </div>
          <CardTitle className="text-base font-semibold">
            Weekly Signature Leaderboard
          </CardTitle>
        </div>
        <CardDescription>
          Pledge rankings by signatures collected this week
        </CardDescription>
      </CardHeader>
      <CardContent>
        {weeklyLeaderboard.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No signatures recorded this week yet.
          </p>
        ) : (
          <div className="space-y-2.5">
            {weeklyLeaderboard.map((entry, index) => {
              const rankStyle = index < 3 ? RANK_STYLES[index] : null;
              const barWidth =
                maxCount > 0 ? Math.max((entry.count / maxCount) * 100, 4) : 4;

              return (
                <div
                  key={entry.pledge.id}
                  className={`flex items-center gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:border-border ${
                    rankStyle
                      ? `${rankStyle.bg} ring-1 ring-inset ${rankStyle.ring}`
                      : ""
                  }`}
                >
                  <div className="flex h-8 w-10 shrink-0 items-center justify-center">
                    {rankStyle ? (
                      <Badge
                        className={`${rankStyle.badge} px-1.5 py-0 font-mono text-[0.65rem] tracking-wider`}
                      >
                        {rankStyle.label}
                      </Badge>
                    ) : (
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  <Avatar className="h-8 w-8 ring-1 ring-inset ring-border/80">
                    <AvatarFallback className="bg-muted/60 text-[0.65rem] text-foreground">
                      {getInitials(entry.pledge.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span
                        className={`truncate text-sm font-medium ${
                          rankStyle ? rankStyle.text : "text-foreground"
                        }`}
                      >
                        {entry.pledge.name}
                      </span>
                      <span className="ml-2 font-mono text-sm font-semibold tabular-nums text-foreground">
                        {entry.count}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                      <div
                        className={`h-full rounded-full transition-all ${
                          rankStyle
                            ? rankStyle.bar
                            : "bg-gradient-to-r from-primary/60 to-primary/30"
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

        <Separator className="my-4 bg-border/60" />
        <Link
          href="/signatures"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          View full details
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

export function DashboardLeaderboardSkeleton() {
  return (
    <Card className="border-border/60 bg-card/40 backdrop-blur-xl lg:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="mt-1 h-3 w-72" />
      </CardHeader>
      <CardContent className="space-y-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </CardContent>
    </Card>
  );
}
