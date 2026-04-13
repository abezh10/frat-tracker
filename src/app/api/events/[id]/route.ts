import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isBrotherOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isBrotherOrAdmin(user.role)) {
      return NextResponse.json(
        { error: "Only brothers can delete events" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    await supabase.from("Signature").delete().eq("eventId", id);
    const { error } = await supabase.from("Event").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
