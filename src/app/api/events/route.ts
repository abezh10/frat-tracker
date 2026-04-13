import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const events = await prisma.event.findMany({
      orderBy: { date: "desc" },
      include: {
        createdBy: { select: { id: true, name: true } },
        signatures: {
          include: {
            pledge: { select: { id: true, name: true } },
            brother: { select: { id: true, name: true } },
          },
        },
        _count: { select: { signatures: true } },
      },
    });

    return NextResponse.json(events);
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
    if (user.role !== "BROTHER") {
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

    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        date: new Date(date),
        location: location || null,
        createdById: user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        signatures: {
          include: {
            pledge: { select: { id: true, name: true } },
            brother: { select: { id: true, name: true } },
          },
        },
        _count: { select: { signatures: true } },
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
