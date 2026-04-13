import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser, isBrotherOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const assignedToId = searchParams.get("assignedToId");

  const supabase = await createClient();
  let query = supabase
    .from("Task")
    .select(
      "*, assignedTo:User!Task_assignedToId_fkey(id, name), assignedBy:User!Task_assignedById_fkey(id, name)"
    )
    .order("createdAt", { ascending: false });

  if (!isBrotherOrAdmin(user.role)) {
    query = query.eq("assignedToId", user.id);
  }

  if (status) query = query.eq("status", status);
  if (assignedToId) query = query.eq("assignedToId", assignedToId);

  const { data: tasks, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isBrotherOrAdmin(user.role)) {
    return NextResponse.json(
      { error: "Only brothers can create tasks" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { title, description, assignedToId, dueDate } = body;

  if (!title || !assignedToId) {
    return NextResponse.json(
      { error: "Title and assignee are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: task, error } = await supabase
    .from("Task")
    .insert({
      id: crypto.randomUUID(),
      title,
      description: description || null,
      assignedToId,
      assignedById: user.id,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    })
    .select(
      "*, assignedTo:User!Task_assignedToId_fkey(id, name), assignedBy:User!Task_assignedById_fkey(id, name)"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(task, { status: 201 });
}
