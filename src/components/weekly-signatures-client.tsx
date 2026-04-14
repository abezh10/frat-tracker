"use client";

import { Fragment, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  startOfISOWeek,
  addWeeks,
  getISOWeek,
  getISOWeekYear,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  PenTool,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const SIGNATURE_GOAL = 40;

// Spring Week 1 = ISO week 2026-W14 (Mon March 30 – Sun April 5)
const SPRING_W1_YEAR = 2026;
const SPRING_W1_WEEK = 14;

interface WeeklySignaturesClientProps {
  currentWeek: string;
  pledgeData: Array<{
    pledge: { id: string; name: string; pledgeClass: string | null };
    thisWeekCount: number;
    lastWeekCount: number;
    cumulativeTotal: number;
    signatures: Array<{
      id: string;
      brother: { name: string };
      event: { title: string };
      createdAt: string;
    }>;
  }>;
  currentUser: { id: string; name: string; role: string };
}

function getWeekDates(isoWeek: string) {
  const [yearStr, weekStr] = isoWeek.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);
  const jan4 = new Date(year, 0, 4);
  const startOfW1 = startOfISOWeek(jan4);
  const weekStart = addWeeks(startOfW1, week - 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return { start: weekStart, end: weekEnd };
}

function shiftWeek(isoWeek: string, direction: number): string {
  const { start } = getWeekDates(isoWeek);
  const shifted = addWeeks(start, direction);
  const year = getISOWeekYear(shifted);
  const week = getISOWeek(shifted);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function getSpringWeekLabel(isoWeek: string): string | null {
  if (!isoWeek.startsWith(`${SPRING_W1_YEAR}-W`)) return null;
  const weekNum = parseInt(isoWeek.split("-W")[1]);
  if (weekNum < SPRING_W1_WEEK) return null;
  return `Spring Week ${weekNum - SPRING_W1_WEEK + 1}`;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <Badge className="gap-0.5 bg-amber-500/20 font-mono text-amber-300 tabular-nums ring-1 ring-inset ring-amber-400/40">
        <Trophy className="size-3" />1
      </Badge>
    );
  }
  if (rank === 2) {
    return (
      <Badge className="bg-zinc-400/15 font-mono text-zinc-200 tabular-nums ring-1 ring-inset ring-zinc-300/30">
        2
      </Badge>
    );
  }
  if (rank === 3) {
    return (
      <Badge className="bg-orange-500/15 font-mono text-orange-300 tabular-nums ring-1 ring-inset ring-orange-400/30">
        3
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-border/60 bg-muted/20 font-mono tabular-nums text-muted-foreground"
    >
      {rank}
    </Badge>
  );
}

function TrendIndicator({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  if (current > previous) {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-400">
        <TrendingUp className="size-4" />
        <span className="font-mono text-xs tabular-nums">
          +{current - previous}
        </span>
      </span>
    );
  }
  if (current < previous) {
    return (
      <span className="inline-flex items-center gap-1 text-blue-400">
        <TrendingDown className="size-4" />
        <span className="font-mono text-xs tabular-nums">
          {current - previous}
        </span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-muted-foreground">
      <Minus className="size-4" />
    </span>
  );
}

export function WeeklySignaturesClient({
  currentWeek,
  pledgeData,
}: WeeklySignaturesClientProps) {
  const router = useRouter();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const dirRef = useRef<"left" | "right" | null>(null);

  const { start: weekStart, end: weekEnd } = getWeekDates(currentWeek);
  const springLabel = getSpringWeekLabel(currentWeek);

  const sorted = [...pledgeData].sort(
    (a, b) => b.thisWeekCount - a.thisWeekCount,
  );

  const totalSigs = sorted.reduce((s, d) => s + d.thisWeekCount, 0);
  const activePledges = sorted.filter((d) => d.thisWeekCount > 0).length;
  const avg = sorted.length > 0 ? (totalSigs / sorted.length).toFixed(1) : "0";

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function goToWeek(direction: number) {
    dirRef.current = direction > 0 ? "left" : "right";
    router.push(`/signatures?week=${shiftWeek(currentWeek, direction)}`);
  }

  return (
    <div className="space-y-8">
      {/* Week Navigation */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/40 p-3 backdrop-blur-xl">
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToWeek(-1)}
          className="border-border/60 bg-background/40 hover:border-primary/30 hover:bg-primary/10"
        >
          <ChevronLeft />
        </Button>
        <div className="min-w-56 overflow-hidden text-center">
          <div
            key={currentWeek}
            className={cn(
              dirRef.current === "left" &&
              "animate-in slide-in-from-right-8 fade-in duration-500",
              dirRef.current === "right" &&
              "animate-in slide-in-from-left-8 fade-in duration-500",
            )}
          >
            {springLabel ? (
              <>
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground/80">
                  Spring Semester
                </span>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  {springLabel}
                </h2>
              </>
            ) : (
              <span className="block py-1 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground/80">
                Week of
              </span>
            )}
            <p className="text-xs text-muted-foreground">
              {format(weekStart, "MMM d")} &ndash;{" "}
              {format(weekEnd, "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToWeek(1)}
          className="border-border/60 bg-background/40 hover:border-primary/30 hover:bg-primary/10"
        >
          <ChevronRight />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/40 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Total Signatures
              </CardTitle>
              <PenTool className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-foreground">
              {totalSigs}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">this week</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/40 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Active Pledges
              </CardTitle>
              <Trophy className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-foreground">
              {activePledges}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / {sorted.length}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              with &ge;1 signature
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/40 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Avg per Pledge
              </CardTitle>
              <TrendingUp className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-foreground">
              {avg}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              signatures this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rankings Table */}
      <Card className="border-border/60 bg-card/40 backdrop-blur-xl">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="text-base font-semibold">
            Pledge Rankings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">#</TableHead>
                <TableHead>Pledge</TableHead>
                <TableHead className="text-center">This Week</TableHead>
                <TableHead className="text-center">Trend</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="hidden w-48 md:table-cell">
                  Progress
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No pledges found.
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((item, index) => {
                  const rank = index + 1;
                  const isExpanded = expandedRows.has(item.pledge.id);
                  const pct = Math.min(
                    Math.round(
                      (item.cumulativeTotal / SIGNATURE_GOAL) * 100,
                    ),
                    100,
                  );

                  return (
                    <Fragment key={item.pledge.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => toggleRow(item.pledge.id)}
                        aria-expanded={isExpanded}
                      >
                        <TableCell className="text-center">
                          <RankBadge rank={rank} />
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {item.pledge.name}
                          </span>
                          {item.pledge.pledgeClass && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {item.pledge.pledgeClass}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-lg font-semibold tabular-nums">
                            {item.thisWeekCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <TrendIndicator
                            current={item.thisWeekCount}
                            previous={item.lastWeekCount}
                          />
                        </TableCell>
                        <TableCell className="text-center font-medium tabular-nums">
                          {item.cumulativeTotal}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="flex-1" />
                            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                              {item.cumulativeTotal}/{SIGNATURE_GOAL}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ChevronDown
                            className={cn(
                              "size-4 text-muted-foreground transition-transform duration-200",
                              isExpanded && "rotate-180",
                            )}
                          />
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={7} className="p-0">
                            <div className="px-6 py-4 md:px-10">
                              {item.signatures.length === 0 ? (
                                <p className="py-2 text-sm text-muted-foreground">
                                  No signatures this week.
                                </p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                                        <th className="pb-2 text-left font-medium">
                                          Brother
                                        </th>
                                        <th className="pb-2 text-left font-medium">
                                          Event
                                        </th>
                                        <th className="pb-2 text-right font-medium">
                                          Date
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {item.signatures.map((sig) => (
                                        <tr
                                          key={sig.id}
                                          className="border-t border-border/50"
                                        >
                                          <td className="py-2">
                                            {sig.brother.name}
                                          </td>
                                          <td className="py-2 text-muted-foreground">
                                            {sig.event.title}
                                          </td>
                                          <td className="py-2 text-right text-muted-foreground">
                                            {format(
                                              new Date(sig.createdAt),
                                              "MMM d, h:mm a",
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
