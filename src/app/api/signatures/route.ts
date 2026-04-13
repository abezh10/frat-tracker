import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isBrotherOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function parseISOWeek(weekStr: string): { start: Date; end: Date } {
  const match = weekStr.match(/^(\d{4})-W(\d{2})$/);
  if (!match) throw new Error("Invalid ISO week format");

  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);

  // Jan 4 is always in week 1 per ISO 8601
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 7);

  return { start: monday, end: sunday };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const week = searchParams.get("week");
    const pledgeId = searchParams.get("pledgeId");

    const supabase = await createClient();
    let query = supabase
      .from("Signature")
      .select(
        "*, event:Event!Signature_eventId_fkey(*), pledge:User!Signature_pledgeId_fkey(id, name), brother:User!Signature_brotherId_fkey(id, name)"
      )
      .order("createdAt", { ascending: false });

    if (week) {
      const { start, end } = parseISOWeek(week);
      query = query
        .gte("createdAt", start.toISOString())
        .lt("createdAt", end.toISOString());
    }

    if (pledgeId) {
      query = query.eq("pledgeId", pledgeId);
    }

    const { data: signatures, error } = await query;

    if (error) throw error;

    return NextResponse.json(signatures);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch signatures" },
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
        { error: "Only brothers can award signatures" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { eventId, pledgeId } = body;

    if (!eventId || !pledgeId) {
      return NextResponse.json(
        { error: "eventId and pledgeId are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: signature, error } = await supabase
      .from("Signature")
      .insert({
        id: crypto.randomUUID(),
        eventId,
        pledgeId,
        brotherId: user.id,
      })
      .select(
        "*, event:Event!Signature_eventId_fkey(*), pledge:User!Signature_pledgeId_fkey(id, name), brother:User!Signature_brotherId_fkey(id, name)"
      )
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Signature already awarded for this event and pledge" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(signature, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to award signature" },
      { status: 500 }
    );
  }
}
