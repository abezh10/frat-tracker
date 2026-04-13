import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { EventsClient } from "@/components/events-client";

export default async function EventsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [events, pledges] = await Promise.all([
    prisma.event.findMany({
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
    }),
    prisma.user.findMany({
      where: { role: "PLEDGE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedEvents = events.map((event) => ({
    ...event,
    date: event.date.toISOString(),
    createdAt: event.createdAt.toISOString(),
    signatures: event.signatures.map((sig) => ({
      ...sig,
      createdAt: sig.createdAt.toISOString(),
    })),
  }));

  return (
    <>
      <Header title="Signature Events" />
      <div className="flex-1 overflow-auto p-6">
        <EventsClient
          events={serializedEvents}
          currentUser={{ id: user.id, name: user.name, role: user.role }}
          pledges={pledges}
        />
      </div>
    </>
  );
}
