import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser, isBrotherOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!status) {
    return NextResponse.json(
      { error: "Status is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: task, error: findError } = await supabase
    .from("Task")
    .select("*")
    .eq("id", id)
    .single();

  if (findError || !task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (!isBrotherOrAdmin(user.role) && task.assignedToId !== user.id) {
    return NextResponse.json(
      { error: "You can only update your own tasks" },
      { status: 403 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("Task")
    .update({ status })
    .eq("id", id)
    .select(
      "*, assignedTo:User!Task_assignedToId_fkey(id, name), assignedBy:User!Task_assignedById_fkey(id, name)"
    )
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isBrotherOrAdmin(user.role)) {
    return NextResponse.json(
      { error: "Only brothers can delete tasks" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const supabase = await createClient();
  const { data: task, error: findError } = await supabase
    .from("Task")
    .select("id")
    .eq("id", id)
    .single();

  if (findError || !task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from("Task")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
