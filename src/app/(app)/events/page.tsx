import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { EventsClient } from "@/components/events-client";

export default async function EventsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [eventsResult, pledgesResult] = await Promise.all([
    supabase
      .from("Event")
      .select(
        `*,
        createdBy:User!Event_createdById_fkey(id, name),
        signatures:Signature(
          *,
          pledge:User!Signature_pledgeId_fkey(id, name),
          brother:User!Signature_brotherId_fkey(id, name)
        )`
      )
      .order("date", { ascending: false }),
    supabase
      .from("User")
      .select("id, name")
      .eq("role", "PLEDGE")
      .order("name"),
  ]);

  const events = eventsResult.data ?? [];
  const pledges = pledgesResult.data ?? [];

  const serializedEvents = events.map(
    (event: {
      signatures?: unknown[];
      _count?: unknown;
      [key: string]: unknown;
    }) => ({
      ...event,
      _count: { signatures: event.signatures?.length ?? 0 },
    })
  );

  return (
    <>
      <Header title="Signature Events" />
      <div className="flex-1 overflow-auto p-6">
        <EventsClient
          events={serializedEvents as unknown as React.ComponentProps<typeof EventsClient>["events"]}
          currentUser={{ id: user.id, name: user.name, role: user.role }}
          pledges={pledges}
        />
      </div>
    </>
  );
}
