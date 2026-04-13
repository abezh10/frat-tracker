import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

function displayNameFromAuth(authUser: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const meta = authUser.user_metadata;
  const fromMeta =
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name);
  if (fromMeta) return fromMeta;
  const email = authUser.email ?? "";
  const local = email.split("@")[0];
  return local || "Member";
}

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: user, error } = await supabase
    .from("User")
    .select("*")
    .eq("authId", authUser.id)
    .maybeSingle();

  if (error) {
    console.error("getCurrentUser error:", error.message, error.code);
    return null;
  }

  if (user) return user;

  const email = authUser.email ?? "";
  const { data: created, error: insertError } = await supabase
    .from("User")
    .insert({
      id: crypto.randomUUID(),
      authId: authUser.id,
      name: displayNameFromAuth(authUser),
      email,
      role: "PLEDGE",
      pledgeClass: null,
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: again } = await supabase
        .from("User")
        .select("*")
        .eq("authId", authUser.id)
        .maybeSingle();
      return again;
    }
    console.error("ensureUserProfile:", insertError.message, insertError.code);
    return null;
  }

  return created;
});

export function isBrotherOrAdmin(role: string) {
  return role === "BROTHER" || role === "ADMIN";
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireBrother() {
  const user = await requireUser();
  if (!isBrotherOrAdmin(user.role)) throw new Error("Forbidden: Brothers only");
  return user;
}
