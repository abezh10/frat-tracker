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

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  createdAt: string;
  assignedTo: { id: string; name: string };
  assignedBy: { id: string; name: string };
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
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    IN_PROGRESS:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
    COMPLETED:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
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
}: {
  task: Task;
  isBrother: boolean;
  currentUserId: string;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);

  const isOwnTask = task.assignedTo.id === currentUserId;
  const canUpdateStatus = isBrother || isOwnTask;
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "COMPLETED";

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

  return (
    <Card className="transition-all duration-200 hover:shadow-md hover:ring-foreground/20">
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
        <CardDescription className="flex items-center gap-2">
          <StatusBadge status={task.status} />
          {isOverdue && (
            <Badge variant="destructive">Overdue</Badge>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {task.description}
          </p>
        )}

        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Assigned to</span>
            <span className="font-medium text-foreground">
              {task.assignedTo.name}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Assigned by</span>
            <span className="font-medium text-foreground">
              {task.assignedBy.name}
            </span>
          </div>
          {task.dueDate && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3" />
                Due
              </span>
              <span
                className={
                  isOverdue
                    ? "font-medium text-destructive"
                    : "font-medium text-foreground"
                }
              >
                {format(new Date(task.dueDate), "MMM d, yyyy")}
              </span>
            </div>
          )}
        </div>

        {canUpdateStatus && task.status !== "COMPLETED" && (
          <div className="flex gap-2 pt-1">
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
          </div>
        )}
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
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const isBrother = currentUser.role === "BROTHER";

  const pendingTasks = tasks.filter((t) => t.status === "PENDING");
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");

  function resetForm() {
    setTitle("");
    setDescription("");
    setAssigneeId("");
    setDueDate("");
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
          assignedToId: assigneeId,
          dueDate: dueDate || null,
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

  function renderTaskGrid(taskList: Task[]) {
    if (taskList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Circle className="size-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            No tasks found.
          </p>
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
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""} total
        </p>
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
                  Assign a new task to a pledge.
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
                <div className="space-y-2">
                  <Label htmlFor="task-due-date">Due Date</Label>
                  <Input
                    id="task-due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading || !title || !assigneeId}>
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
