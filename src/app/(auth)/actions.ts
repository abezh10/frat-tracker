"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function friendlyAuthError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Wait a bit, or turn off email confirmation in Supabase (Auth → Providers → Email) while developing.";
  }
  return message;
}

export async function login(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  redirect("/dashboard");
}

export async function register(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  const pledgeClass = formData.get("pledgeClass") as string | null;

  if (!name || !email || !phone || !password || !role) {
    return { error: "All required fields must be filled." };
  }

  if (role === "PLEDGE" && !pledgeClass) {
    return { error: "Pledge class is required for pledges." };
  }

  if (!["BROTHER", "PLEDGE"].includes(role)) {
    return { error: "Invalid role selected." };
  }

  const supabase = await createClient();

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    return { error: friendlyAuthError(signUpError.message) };
  }

  if (!data.user) {
    return { error: "Sign-up failed. Please try again." };
  }

  const { error: insertError } = await supabase.from("User").insert({
    id: crypto.randomUUID(),
    authId: data.user.id,
    name,
    email,
    phone,
    role,
    pledgeClass: role === "PLEDGE" ? pledgeClass || null : null,
  });

  if (insertError) {
    const hint =
      insertError.code === "42501" ||
      insertError.message.toLowerCase().includes("row-level security") ||
      insertError.message.toLowerCase().includes("permission denied")
        ? " Run `supabase/migrations/0004_rls_policies/migration.sql` in the Supabase SQL Editor to set up RLS policies."
        : "";
    return {
      error: `Could not save your profile: ${insertError.message}.${hint}`,
    };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
