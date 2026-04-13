import { formatDistanceToNow } from "date-fns";
import { Calendar, CheckSquare, Clock, PenTool } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";

type ActivityType = "task" | "event" | "signature";

interface ActivityItem {
  type: ActivityType;
  title: string;
  description: string;
  createdAt: string;
}

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case "task":
      return <CheckSquare className="h-4 w-4 text-amber-400" />;
    case "event":
      return <Calendar className="h-4 w-4 text-primary" />;
    case "signature":
      return <PenTool className="h-4 w-4 text-cyan-400" />;
  }
}

export async function DashboardActivity() {
  const supabase = await createClient();

  const [recentTasksResult, recentSignaturesResult, recentEventsResult] =
    await Promise.all([
      supabase
        .from("Task")
        .select(
          "*, assignedTo:User!Task_assignedToId_fkey(name), assignedBy:User!Task_assignedById_fkey(name)"
        )
        .order("createdAt", { ascending: false })
        .limit(10),
      supabase
        .from("Signature")
        .select(
          "*, pledge:User!Signature_pledgeId_fkey(name), brother:User!Signature_brotherId_fkey(name), event:Event!Signature_eventId_fkey(title)"
        )
        .order("createdAt", { ascending: false })
        .limit(10),
      supabase
        .from("Event")
        .select("*, createdBy:User!Event_createdById_fkey(name)")
        .order("createdAt", { ascending: false })
        .limit(10),
    ]);

  const recentTasks = recentTasksResult.data ?? [];
  const recentSignatures = recentSignaturesResult.data ?? [];
  const recentEvents = recentEventsResult.data ?? [];

  const recentActivity: ActivityItem[] = [
    ...recentTasks.map(
      (task: {
        title: string;
        assignedTo: { name: string };
        assignedBy: { name: string };
        createdAt: string;
      }): ActivityItem => ({
        type: "task",
        title: task.title,
        description: `Assigned to ${task.assignedTo.name} by ${task.assignedBy.name}`,
        createdAt: task.createdAt,
      })
    ),
    ...recentSignatures.map(
      (sig: {
        brother: { name: string };
        pledge: { name: string };
        event: { title: string };
        createdAt: string;
      }): ActivityItem => ({
        type: "signature",
        title: `Signature from ${sig.brother.name}`,
        description: `${sig.pledge.name} at ${sig.event.title}`,
        createdAt: sig.createdAt,
      })
    ),
    ...recentEvents.map(
      (event: {
        title: string;
        createdBy: { name: string };
        location: string | null;
        createdAt: string;
      }): ActivityItem => ({
        type: "event",
        title: event.title,
        description: `Created by ${event.createdBy.name}${event.location ? ` · ${event.location}` : ""}`,
        createdAt: event.createdAt,
      })
    ),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 15);

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-muted/50 ring-1 ring-inset ring-border/60">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-base font-semibold">
            Recent Activity
          </CardTitle>
        </div>
        <CardDescription>Latest updates across the chapter</CardDescription>
      </CardHeader>
      <CardContent>
        {recentActivity.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No recent activity.
          </p>
        ) : (
          <div className="relative space-y-0">
            {recentActivity.map((activity, index) => (
              <div
                key={`${activity.type}-${activity.createdAt}-${index}`}
                className="relative flex gap-3 pb-5 last:pb-0"
              >
                {index < recentActivity.length - 1 && (
                  <div className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-border/60" />
                )}

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card">
                  {getActivityIcon(activity.type)}
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="truncate text-sm font-medium leading-tight text-foreground">
                    {activity.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {activity.description}
                  </p>
                  <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground/60">
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
  );
}

export function DashboardActivitySkeleton() {
  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="mt-1 h-3 w-56" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </CardContent>
    </Card>
  );
}
