"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  Circle,
  CalendarDays,
  Users,
  Timer,
  UserPlus,
  UserMinus,
  MessageCircle,
  Send,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TaskClaim {
  id: string;
  userId: string;
  claimedAt: string;
  user: { id: string; name: string };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueAt: string | null;
  expiresAt: string | null;
  openToAll: boolean;
  maxSpots: number | null;
  createdAt: string;
  assignedTo: { id: string; name: string } | null;
  assignedBy: { id: string; name: string } | null;
  claims: TaskClaim[];
  source?: string | null;
  whatsappSender?: string | null;
}

interface TasksClientProps {
  tasks: Task[];
  currentUser: { id: string; name: string; role: string };
  pledges: Array<{ id: string; name: string }>;
}

function statusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "IN_PROGRESS":
      return "In Progress";
    case "COMPLETED":
      return "Completed";
    default:
      return status;
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING:
      "bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-400/25",
    IN_PROGRESS:
      "bg-primary/10 text-primary ring-1 ring-inset ring-primary/30",
    COMPLETED:
      "bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/25",
  };

  return (
    <Badge variant="secondary" className={styles[status] ?? ""}>
      {status === "PENDING" && <Circle className="size-3" />}
      {status === "IN_PROGRESS" && <Clock className="size-3" />}
      {status === "COMPLETED" && <CheckCircle2 className="size-3" />}
      {statusLabel(status)}
    </Badge>
  );
}

function TaskCard({
  task,
  isBrother,
  currentUserId,
  onUpdateStatus,
  onDelete,
  onClaim,
  onUnclaim,
  onNotify,
}: {
  task: Task;
  isBrother: boolean;
  currentUserId: string;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClaim: (id: string) => Promise<void>;
  onUnclaim: (id: string) => Promise<void>;
  onNotify: (taskId: string, sender: string | null | undefined) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);

  const isOwnTask = task.assignedTo?.id === currentUserId;
  const canUpdateStatus = isBrother || isOwnTask;
  const isOverdue =
    task.dueAt &&
    new Date(task.dueAt) < new Date() &&
    task.status !== "COMPLETED";
  const isExpired =
    task.expiresAt &&
    new Date(task.expiresAt) < new Date() &&
    task.status !== "COMPLETED";

  const userClaimed = task.claims?.some((c) => c.userId === currentUserId);
  const claimCount = task.claims?.length ?? 0;
  const spotsFull = task.maxSpots != null && claimCount >= task.maxSpots;

  async function handleStatusChange(newStatus: string) {
    setUpdating(true);
    try {
      await onUpdateStatus(task.id, newStatus);
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    setUpdating(true);
    try {
      await onDelete(task.id);
    } finally {
      setUpdating(false);
    }
  }

  async function handleClaim() {
    setUpdating(true);
    try {
      await onClaim(task.id);
    } finally {
      setUpdating(false);
    }
  }

  async function handleUnclaim() {
    setUpdating(true);
    try {
      await onUnclaim(task.id);
    } finally {
      setUpdating(false);
    }
  }

  async function handleNotify() {
    setUpdating(true);
    try {
      await onNotify(task.id, task.whatsappSender);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <Card className="group border-border/60 bg-card/40 backdrop-blur-xl transition-all duration-200 hover:border-primary/30 hover:shadow-[0_20px_60px_-30px_var(--rail-glow)]">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2">{task.title}</CardTitle>
          {isBrother && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={updating}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <StatusBadge status={task.status} />
          {isOverdue && (
            <Badge variant="destructive">Overdue</Badge>
          )}
          {isExpired && (
            <Badge className="bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-400/25">
              Expired
            </Badge>
          )}
          {task.openToAll && (
            <Badge className="bg-cyan-500/10 text-cyan-300 ring-1 ring-inset ring-cyan-400/25">
              <Users className="size-3" />
              Open
            </Badge>
          )}
          {task.source === "WHATSAPP" && (
            <Badge className="bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/25">
              <MessageCircle className="size-3" />
              WhatsApp
            </Badge>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {task.description && (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {task.description}
          </p>
        )}

        <div className="space-y-1.5 rounded-md border border-border/60 bg-muted/20 p-3 text-xs">
          {task.openToAll ? (
            <div className="flex items-center justify-between">
              <span className="font-mono uppercase tracking-wider text-muted-foreground/70">
                Spots
              </span>
              <span className="font-mono font-medium tabular-nums text-foreground">
                {claimCount}{task.maxSpots != null ? ` / ${task.maxSpots}` : ""} claimed
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="font-mono uppercase tracking-wider text-muted-foreground/70">
                Assigned to
              </span>
              <span className="font-medium text-foreground">
                {task.assignedTo?.name ?? "—"}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="font-mono uppercase tracking-wider text-muted-foreground/70">
              Assigned by
            </span>
            <span className="font-medium text-foreground">
              {task.assignedBy?.name ?? (task.source === "WHATSAPP" ? "WhatsApp" : "—")}
            </span>
          </div>
          {task.dueAt && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 font-mono uppercase tracking-wider text-muted-foreground/70">
                <CalendarDays className="size-3" />
                Due
              </span>
              <span
                className={
                  isOverdue
                    ? "font-mono font-medium tabular-nums text-destructive"
                    : "font-mono font-medium tabular-nums text-foreground"
                }
              >
                {format(new Date(task.dueAt), "MMM d, yyyy · h:mm a")}
              </span>
            </div>
          )}
          {task.expiresAt && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 font-mono uppercase tracking-wider text-muted-foreground/70">
                <Timer className="size-3" />
                Expires
              </span>
              <span
                className={
                  isExpired
                    ? "font-mono font-medium tabular-nums text-destructive"
                    : "font-mono font-medium tabular-nums text-foreground"
                }
              >
                {format(new Date(task.expiresAt), "MMM d, yyyy · h:mm a")}
              </span>
            </div>
          )}
        </div>

        {task.openToAll && task.claims.length > 0 && (
          <div className="space-y-1">
            <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground/70">
              Claimed by
            </p>
            <div className="flex flex-wrap gap-1.5">
              {task.claims.map((c) => (
                <Badge key={c.id} variant="secondary" className="text-xs">
                  {c.user.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {task.openToAll && !isBrother && !userClaimed && !spotsFull && task.status !== "COMPLETED" && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleClaim}
              disabled={updating}
            >
              <UserPlus className="size-3.5" />
              Claim Spot
            </Button>
          )}
          {task.openToAll && !isBrother && userClaimed && task.status !== "COMPLETED" && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleUnclaim}
              disabled={updating}
            >
              <UserMinus className="size-3.5" />
              Unclaim
            </Button>
          )}

          {isBrother && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleNotify}
              disabled={updating}
            >
              <Send className="size-3.5" />
              Send WhatsApp
            </Button>
          )}

          {canUpdateStatus && task.status !== "COMPLETED" && (
            <>
              {task.status === "PENDING" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleStatusChange("IN_PROGRESS")}
                  disabled={updating}
                >
                  <Clock className="size-3.5" />
                  Start
                </Button>
              )}
              {(task.status === "PENDING" || task.status === "IN_PROGRESS") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleStatusChange("COMPLETED")}
                  disabled={updating}
                >
                  <CheckCircle2 className="size-3.5" />
                  Complete
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function TasksClient({ tasks, currentUser, pledges }: TasksClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignMode, setAssignMode] = useState<"specific" | "open">("specific");
  const [assigneeId, setAssigneeId] = useState("");
  const [maxSpots, setMaxSpots] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const isBrother = currentUser.role === "BROTHER" || currentUser.role === "ADMIN";

  const pendingTasks = tasks.filter((t) => t.status === "PENDING");
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");

  function resetForm() {
    setTitle("");
    setDescription("");
    setAssignMode("specific");
    setAssigneeId("");
    setMaxSpots("");
    setDueAt("");
    setExpiresAt("");
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          assignedToId: assignMode === "specific" ? assigneeId : null,
          dueAt: dueAt || null,
          expiresAt: expiresAt || null,
          openToAll: assignMode === "open",
          maxSpots: assignMode === "open" && maxSpots ? Number(maxSpots) : null,
        }),
      });
      if (!res.ok) return;
      setDialogOpen(false);
      resetForm();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(taskId: string, status: string) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) router.refresh();
  }

  async function handleDelete(taskId: string) {
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  async function handleClaim(taskId: string) {
    const res = await fetch(`/api/tasks/${taskId}/claim`, { method: "POST" });
    if (res.ok) router.refresh();
  }

  async function handleUnclaim(taskId: string) {
    const res = await fetch(`/api/tasks/${taskId}/claim`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  async function handleNotify(taskId: string, sender: string | null | undefined) {
    const to = window.prompt(
      "Phone number to message (E.164, e.g. 15551234567):",
      sender ?? ""
    );
    if (!to) return;
    const res = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, type: "task", id: taskId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(`Failed to send: ${data.error ?? res.statusText}`);
    }
  }

  const canCreate = assignMode === "open"
    ? !!title
    : !!title && !!assigneeId;

  function renderTaskGrid(taskList: Task[]) {
    if (taskList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/30 py-16">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted/40 ring-1 ring-inset ring-border/60">
            <Circle className="size-5 text-muted-foreground/70" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">No tasks found.</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {taskList.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isBrother={isBrother}
            currentUserId={currentUser.id}
            onUpdateStatus={handleUpdateStatus}
            onDelete={handleDelete}
            onClaim={handleClaim}
            onUnclaim={handleUnclaim}
            onNotify={handleNotify}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground/80">
            Work tracker
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Tasks
          </h2>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono tabular-nums">{tasks.length}</span> task
            {tasks.length !== 1 ? "s" : ""} total
          </p>
        </div>
        {isBrother && (
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger render={<Button />}>
              <Plus className="size-4" />
              Create Task
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Task</DialogTitle>
                <DialogDescription>
                  Assign a new task to a pledge or open it up for anyone.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="task-title">Title</Label>
                  <Input
                    id="task-title"
                    placeholder="Task title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-description">Description</Label>
                  <Textarea
                    id="task-description"
                    placeholder="Optional description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Assignment</Label>
                  <Select
                    value={assignMode}
                    onValueChange={(v) => {
                      if (v === "specific" || v === "open") setAssignMode(v);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="specific">Assign to specific pledge</SelectItem>
                      <SelectItem value="open">Open to all pledges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {assignMode === "specific" && (
                  <div className="space-y-2">
                    <Label>Assign to</Label>
                    <Select
                      value={assigneeId}
                      onValueChange={(v) => { if (v) setAssigneeId(v); }}
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a pledge" />
                      </SelectTrigger>
                      <SelectContent>
                        {pledges.map((pledge) => (
                          <SelectItem key={pledge.id} value={pledge.id}>
                            {pledge.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {assignMode === "open" && (
                  <div className="space-y-2">
                    <Label htmlFor="max-spots">Max Spots</Label>
                    <Input
                      id="max-spots"
                      type="number"
                      min={1}
                      placeholder="Unlimited if empty"
                      value={maxSpots}
                      onChange={(e) => setMaxSpots(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty for unlimited sign-ups.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="task-due-at">Due Date & Time</Label>
                  <Input
                    id="task-due-at"
                    type="datetime-local"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-expires-at">
                    Expires At{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="task-expires-at"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Task becomes unavailable after this time.
                  </p>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={loading || !canCreate}>
                    {loading ? "Creating..." : "Create Task"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue={0}>
        <TabsList>
          <TabsTrigger value={0}>
            All ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value={1}>
            Pending ({pendingTasks.length})
          </TabsTrigger>
          <TabsTrigger value={2}>
            In Progress ({inProgressTasks.length})
          </TabsTrigger>
          <TabsTrigger value={3}>
            Completed ({completedTasks.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value={0}>{renderTaskGrid(tasks)}</TabsContent>
        <TabsContent value={1}>
          {renderTaskGrid(pendingTasks)}
        </TabsContent>
        <TabsContent value={2}>
          {renderTaskGrid(inProgressTasks)}
        </TabsContent>
        <TabsContent value={3}>
          {renderTaskGrid(completedTasks)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
