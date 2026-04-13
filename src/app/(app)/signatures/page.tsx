import { redirect } from "next/navigation";
import { startOfISOWeek } from "date-fns";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { WeeklySignaturesClient } from "@/components/weekly-signatures-client";

function getWeekRange(isoWeek: string) {
  const [yearStr, weekStr] = isoWeek.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);
  const jan4 = new Date(year, 0, 4);
  const startOfWeek1 = startOfISOWeek(jan4);
  const weekStart = new Date(startOfWeek1);
  weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return { start: weekStart, end: weekEnd };
}

function getCurrentISOWeek(): string {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const start = startOfISOWeek(jan4);
  const diff = now.getTime() - start.getTime();
  const weekNum = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export default async function SignaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const params = await searchParams;
  const currentWeek =
    typeof params.week === "string" ? params.week : getCurrentISOWeek();

  const { start: weekStart, end: weekEnd } = getWeekRange(currentWeek);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const [
    pledgesResult,
    currentWeekSigsResult,
    lastWeekSigsResult,
    cumulativeSigsResult,
    weekSigsDetailResult,
  ] = await Promise.all([
    supabase
      .from("User")
      .select("id, name, pledgeClass")
      .eq("role", "PLEDGE")
      .order("name"),
    supabase
      .from("Signature")
      .select("pledgeId")
      .gte("createdAt", weekStart.toISOString())
      .lt("createdAt", weekEnd.toISOString()),
    supabase
      .from("Signature")
      .select("pledgeId")
      .gte("createdAt", prevWeekStart.toISOString())
      .lt("createdAt", weekStart.toISOString()),
    supabase.from("Signature").select("pledgeId"),
    supabase
      .from("Signature")
      .select(
        "*, brother:User!Signature_brotherId_fkey(name), event:Event!Signature_eventId_fkey(title)"
      )
      .gte("createdAt", weekStart.toISOString())
      .lt("createdAt", weekEnd.toISOString())
      .order("createdAt", { ascending: false }),
  ]);

  const pledges = pledgesResult.data ?? [];
  const currentWeekSigs: { pledgeId: string }[] =
    currentWeekSigsResult.data ?? [];
  const lastWeekSigs: { pledgeId: string }[] = lastWeekSigsResult.data ?? [];
  const cumulativeSigs: { pledgeId: string }[] =
    cumulativeSigsResult.data ?? [];
  const weekSignatures = weekSigsDetailResult.data ?? [];

  const currentMap = new Map<string, number>();
  for (const s of currentWeekSigs) {
    currentMap.set(s.pledgeId, (currentMap.get(s.pledgeId) ?? 0) + 1);
  }

  const lastMap = new Map<string, number>();
  for (const s of lastWeekSigs) {
    lastMap.set(s.pledgeId, (lastMap.get(s.pledgeId) ?? 0) + 1);
  }

  const cumulativeMap = new Map<string, number>();
  for (const s of cumulativeSigs) {
    cumulativeMap.set(s.pledgeId, (cumulativeMap.get(s.pledgeId) ?? 0) + 1);
  }

  const sigsByPledge: Record<string, typeof weekSignatures> = {};
  for (const sig of weekSignatures) {
    if (!sigsByPledge[sig.pledgeId]) sigsByPledge[sig.pledgeId] = [];
    sigsByPledge[sig.pledgeId].push(sig);
  }

  const pledgeData = pledges.map(
    (pledge: { id: string; name: string; pledgeClass: string | null }) => ({
      pledge: {
        id: pledge.id,
        name: pledge.name,
        pledgeClass: pledge.pledgeClass,
      },
      thisWeekCount: currentMap.get(pledge.id) ?? 0,
      lastWeekCount: lastMap.get(pledge.id) ?? 0,
      cumulativeTotal: cumulativeMap.get(pledge.id) ?? 0,
      signatures: (sigsByPledge[pledge.id] ?? []).map(
        (sig: {
          id: string;
          brother: { name: string };
          event: { title: string };
          createdAt: string;
        }) => ({
          id: sig.id,
          brother: { name: sig.brother.name },
          event: { title: sig.event.title },
          createdAt: sig.createdAt,
        })
      ),
    })
  );

  return (
    <>
      <Header title="Weekly Signatures" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <WeeklySignaturesClient
          currentWeek={currentWeek}
          pledgeData={pledgeData}
          currentUser={{ id: user.id, name: user.name, role: user.role }}
        />
      </div>
    </>
  );
}
