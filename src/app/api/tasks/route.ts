import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const assignedToId = searchParams.get("assignedToId");

  const where: Record<string, string> = {};

  if (user.role === "PLEDGE") {
    where.assignedToId = user.id;
  }

  if (status) where.status = status;
  if (assignedToId) where.assignedToId = assignedToId;

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true } },
      assignedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "BROTHER") {
    return NextResponse.json(
      { error: "Only brothers can create tasks" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const { title, description, assignedToId, dueDate } = body;

  if (!title || !assignedToId) {
    return NextResponse.json(
      { error: "Title and assignee are required" },
      { status: 400 },
    );
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      assignedToId,
      assignedById: user.id,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: {
      assignedTo: { select: { id: true, name: true } },
      assignedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(task, { status: 201 });
}
