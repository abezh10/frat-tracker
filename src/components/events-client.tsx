"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Plus,
  Calendar,
  MapPin,
  PenTool,
  Check,
  User,
  Trash2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EventsClientProps {
  events: Array<{
    id: string;
    title: string;
    description: string | null;
    date: string;
    location: string | null;
    createdAt: string;
    createdBy: { id: string; name: string };
    signatures: Array<{
      id: string;
      pledge: { id: string; name: string };
      brother: { id: string; name: string };
    }>;
    _count: { signatures: number };
  }>;
  currentUser: { id: string; name: string; role: string };
  pledges: Array<{ id: string; name: string }>;
}

export function EventsClient({
  events,
  currentUser,
  pledges,
}: EventsClientProps) {
  const router = useRouter();
  const isBrother = currentUser.role === "BROTHER" || currentUser.role === "ADMIN";

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");

  const [signatureDialogEvent, setSignatureDialogEvent] = useState<
    (typeof events)[0] | null
  >(null);
  const [awarding, setAwarding] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, date, location }),
      });
      if (res.ok) {
        setCreateOpen(false);
        setTitle("");
        setDescription("");
        setDate("");
        setLocation("");
        router.refresh();
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleAwardSignature(eventId: string, pledgeId: string) {
    setAwarding(pledgeId);
    try {
      const res = await fetch("/api/signatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, pledgeId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setAwarding(null);
    }
  }

  async function handleDeleteEvent(eventId: string) {
    setDeleting(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (res.ok) {
        setSignatureDialogEvent(null);
        router.refresh();
      }
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground/80">
            Signature events
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Events
          </h2>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono tabular-nums">{events.length}</span> event
            {events.length !== 1 && "s"} total
          </p>
        </div>
        {isBrother && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Create Event</DialogTitle>
                <DialogDescription>
                  Add a new signature event for pledges to attend.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Event title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What's this event about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date & Time</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Where is this event?"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating..." : "Create Event"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed border-border/60 bg-card/40">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted/40 ring-1 ring-inset ring-border/60">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground">
              No events yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isBrother
                ? "Create an event to get started."
                : "Check back soon for upcoming events."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const eventDate = new Date(event.date);
            const signedPledgeIds = new Set(
              event.signatures.map((s) => s.pledge.id)
            );

            return (
              <Card
                key={event.id}
                className="group flex flex-col border-border/60 bg-card/40 backdrop-blur-xl transition-all hover:border-primary/30 hover:shadow-[0_20px_60px_-30px_var(--rail-glow)]"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-lg">
                        {event.title}
                      </CardTitle>
                      {event.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {event.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-center rounded-md border border-border/60 bg-muted/30 px-2.5 py-1 text-center">
                      <span className="font-mono text-[0.6rem] font-medium uppercase leading-none tracking-widest text-muted-foreground">
                        {format(eventDate, "MMM")}
                      </span>
                      <span className="mt-0.5 font-mono text-base font-semibold leading-tight tabular-nums text-foreground">
                        {format(eventDate, "d")}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                      <span className="font-mono text-xs">
                        {format(eventDate, "EEE, MMM d · h:mm a")}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span>{event.createdBy.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PenTool className="h-3.5 w-3.5 shrink-0 text-cyan-400/80" />
                      <span>
                        <span className="font-mono tabular-nums text-foreground">
                          {event._count.signatures}
                        </span>{" "}
                        signature
                        {event._count.signatures !== 1 && "s"} awarded
                      </span>
                    </div>
                  </div>

                  {isBrother && (
                    <div className="flex gap-2">
                      <Dialog
                        open={signatureDialogEvent?.id === event.id}
                        onOpenChange={(open) =>
                          setSignatureDialogEvent(open ? event : null)
                        }
                      >
                        <DialogTrigger render={<Button variant="outline" size="sm" className="flex-1" />}>
                          <PenTool className="mr-2 h-3.5 w-3.5" />
                          Award Signature
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[420px]">
                          <DialogHeader>
                            <DialogTitle>Award Signature</DialogTitle>
                            <DialogDescription>
                              Select pledges to award a signature for{" "}
                              <span className="font-medium text-foreground">
                                {event.title}
                              </span>
                            </DialogDescription>
                          </DialogHeader>
                          <div className="max-h-[320px] space-y-1 overflow-y-auto py-2">
                            {pledges.length === 0 ? (
                              <p className="text-muted-foreground py-4 text-center text-sm">
                                No pledges found.
                              </p>
                            ) : (
                              pledges.map((pledge) => {
                                const alreadySigned =
                                  signedPledgeIds.has(pledge.id);
                                const isAwarding = awarding === pledge.id;

                                return (
                                  <button
                                    key={pledge.id}
                                    disabled={alreadySigned || isAwarding}
                                    onClick={() =>
                                      handleAwardSignature(event.id, pledge.id)
                                    }
                                    className="flex w-full items-center justify-between rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border/60 hover:bg-muted/40 disabled:cursor-default disabled:opacity-60 disabled:hover:border-transparent disabled:hover:bg-transparent"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 text-[0.7rem] font-medium text-foreground ring-1 ring-inset ring-border/60">
                                        {pledge.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .toUpperCase()}
                                      </div>
                                      <span className="text-sm font-medium">
                                        {pledge.name}
                                      </span>
                                    </div>
                                    {alreadySigned ? (
                                      <Badge
                                        variant="secondary"
                                        className="gap-1"
                                      >
                                        <Check className="h-3 w-3" />
                                        Signed
                                      </Badge>
                                    ) : isAwarding ? (
                                      <Badge variant="outline">
                                        Awarding...
                                      </Badge>
                                    ) : (
                                      <PenTool className="text-muted-foreground h-4 w-4" />
                                    )}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteEvent(event.id)}
                        disabled={deleting === event.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
