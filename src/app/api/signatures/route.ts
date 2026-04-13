import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseISOWeek(weekStr: string): { start: Date; end: Date } {
  const match = weekStr.match(/^(\d{4})-W(\d{2})$/);
  if (!match) throw new Error("Invalid ISO week format");

  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);

  // Jan 4 is always in week 1 per ISO 8601
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7; // Convert Sunday=0 to 7
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

    const where: Record<string, unknown> = {};

    if (week) {
      const { start, end } = parseISOWeek(week);
      where.createdAt = { gte: start, lt: end };
    }

    if (pledgeId) {
      where.pledgeId = pledgeId;
    }

    const signatures = await prisma.signature.findMany({
      where,
      include: {
        event: true,
        pledge: { select: { id: true, name: true } },
        brother: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

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
    if (user.role !== "BROTHER") {
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

    const signature = await prisma.signature.create({
      data: {
        eventId,
        pledgeId,
        brotherId: user.id,
      },
      include: {
        event: true,
        pledge: { select: { id: true, name: true } },
        brother: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(signature, { status: 201 });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Signature already awarded for this event and pledge" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to award signature" },
      { status: 500 }
    );
  }
}
