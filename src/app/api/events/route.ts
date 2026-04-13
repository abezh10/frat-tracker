import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isBrotherOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const EVENT_SELECT = `
  *,
  createdBy:User!Event_createdById_fkey(id, name),
  signatures:Signature(
    *,
    pledge:User!Signature_pledgeId_fkey(id, name),
    brother:User!Signature_brotherId_fkey(id, name)
  )
`;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: events, error } = await supabase
      .from("Event")
      .select(EVENT_SELECT)
      .order("date", { ascending: false });

    if (error) throw error;

    const eventsWithCount = (events ?? []).map((e: Record<string, unknown>) => ({
      ...e,
      _count: {
        signatures: Array.isArray(e.signatures)
          ? e.signatures.length
          : 0,
      },
    }));

    return NextResponse.json(eventsWithCount);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isBrotherOrAdmin(user.role)) {
      return NextResponse.json(
        { error: "Only brothers can create events" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, date, location } = body;

    if (!title || !date) {
      return NextResponse.json(
        { error: "Title and date are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: event, error } = await supabase
      .from("Event")
      .insert({
        id: crypto.randomUUID(),
        title,
        description: description || null,
        date: new Date(date).toISOString(),
        location: location || null,
        createdById: user.id,
      })
      .select(EVENT_SELECT)
      .single();

    if (error) throw error;

    const eventWithCount = {
      ...event,
      _count: {
        signatures: Array.isArray(event.signatures)
          ? event.signatures.length
          : 0,
      },
    };

    return NextResponse.json(eventWithCount, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
