import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { TasksClient } from "@/components/tasks-client";

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const where = user.role === "PLEDGE" ? { assignedToId: user.id } : {};

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true } },
      assignedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pledges = await prisma.user.findMany({
    where: { role: "PLEDGE" },
    select: { id: true, name: true },
  });

  const serializedTasks = tasks.map((task) => ({
    ...task,
    dueDate: task.dueDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
  }));

  return (
    <>
      <Header title="Tasks" />
      <div className="flex-1 p-4 md:p-6">
        <TasksClient
          tasks={serializedTasks}
          currentUser={{ id: user.id, name: user.name, role: user.role }}
          pledges={pledges}
        />
      </div>
    </>
  );
}
