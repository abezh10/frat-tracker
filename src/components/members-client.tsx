"use client";

import { format } from "date-fns";
import { Users, User, CheckCircle2, PenTool, Calendar, Phone } from "lucide-react";

import { formatPhoneDisplay } from "@/lib/format-phone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface MembersClientProps {
  brothers: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    createdAt: string;
  }>;
  pledges: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    pledgeClass: string | null;
    createdAt: string;
    taskStats: { total: number; completed: number };
    weeklySignatures: number;
    totalSignatures: number;
  }>;
  currentUser: { id: string; name: string; role: string };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function MembersClient({
  brothers,
  pledges,
  currentUser,
}: MembersClientProps) {
  return (
    <Tabs defaultValue={0} className="space-y-6">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground/80">
          Roster
        </span>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
          Members
        </h2>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono tabular-nums">
            {pledges.length + brothers.length}
          </span>{" "}
          active across pledges and brothers
        </p>
      </div>
      <div className="flex items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value={0}>
            <Users className="size-4" />
            Pledges
            <Badge variant="secondary" className="ml-1 tabular-nums">
              {pledges.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value={1}>
            <User className="size-4" />
            Brothers
            <Badge variant="secondary" className="ml-1 tabular-nums">
              {brothers.length}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value={0} className="mt-4">
        {pledges.length === 0 ? (
          <EmptyState icon={Users} message="No pledges yet" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pledges.map((pledge) => (
              <PledgeCard key={pledge.id} pledge={pledge} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value={1} className="mt-4">
        {brothers.length === 0 ? (
          <EmptyState icon={User} message="No brothers yet" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brothers.map((brother) => (
              <BrotherCard key={brother.id} brother={brother} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function PledgeCard({
  pledge,
}: {
  pledge: MembersClientProps["pledges"][number];
}) {
  const { taskStats, weeklySignatures, totalSignatures } = pledge;
  const completionPct =
    taskStats.total > 0
      ? Math.round((taskStats.completed / taskStats.total) * 100)
      : 0;

  return (
    <Card className="group border-border/60 bg-card/40 backdrop-blur-xl transition-colors hover:border-primary/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>{getInitials(pledge.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{pledge.name}</CardTitle>
            <p className="truncate text-sm text-muted-foreground">
              {pledge.email}
            </p>
            {pledge.phone && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone className="size-3" />
                {formatPhoneDisplay(pledge.phone)}
              </p>
            )}
            {pledge.pledgeClass && (
              <Badge
                variant="outline"
                className="mt-1 border-border/60 bg-muted/30 font-mono text-[0.6rem] uppercase tracking-wider"
              >
                {pledge.pledgeClass}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="size-3.5" />
              Tasks
            </span>
            <span className="font-medium tabular-nums">
              {taskStats.completed}/{taskStats.total}
            </span>
          </div>
          <Progress value={completionPct} />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <PenTool className="size-3.5" />
            Signatures this week
          </span>
          <span className="font-medium tabular-nums">
            {weeklySignatures}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <PenTool className="size-3.5" />
            Total signatures
          </span>
          <span className="font-medium tabular-nums">
            {totalSignatures}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function BrotherCard({
  brother,
}: {
  brother: MembersClientProps["brothers"][number];
}) {
  return (
    <Card className="group border-border/60 bg-card/40 backdrop-blur-xl transition-colors hover:border-primary/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>{getInitials(brother.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{brother.name}</CardTitle>
            <p className="truncate text-sm text-muted-foreground">
              {brother.email}
            </p>
            {brother.phone && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone className="size-3" />
                {formatPhoneDisplay(brother.phone)}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="size-3.5" />
          Member since {format(new Date(brother.createdAt), "MMM yyyy")}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-card/30 py-16 text-muted-foreground">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted/40 ring-1 ring-inset ring-border/60">
        <Icon className="size-5" />
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
