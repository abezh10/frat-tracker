import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: task, error: taskErr } = await supabase
    .from("Task")
    .select("id, openToAll, maxSpots")
    .eq("id", id)
    .single();

  if (taskErr || !task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (!task.openToAll) {
    return NextResponse.json(
      { error: "Task is not open to all" },
      { status: 400 }
    );
  }

  const { count } = await supabase
    .from("TaskClaim")
    .select("id", { count: "exact", head: true })
    .eq("taskId", id);

  if (task.maxSpots && (count ?? 0) >= task.maxSpots) {
    return NextResponse.json(
      { error: "All spots have been claimed" },
      { status: 409 }
    );
  }

  const { error: claimErr } = await supabase.from("TaskClaim").insert({
    id: crypto.randomUUID(),
    taskId: id,
    userId: user.id,
  });

  if (claimErr) {
    if (claimErr.code === "23505") {
      return NextResponse.json(
        { error: "You already claimed this task" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: claimErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("TaskClaim")
    .delete()
    .eq("taskId", id)
    .eq("userId", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
