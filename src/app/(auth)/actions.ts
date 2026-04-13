"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

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
    return { error: error.message };
  }

  redirect("/");
}

export async function register(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  const pledgeClass = formData.get("pledgeClass") as string | null;

  if (!name || !email || !password || !role) {
    return { error: "All required fields must be filled." };
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
    return { error: signUpError.message };
  }

  if (!data.user) {
    return { error: "Sign-up failed. Please try again." };
  }

  try {
    await prisma.user.create({
      data: {
        authId: data.user.id,
        name,
        email,
        role,
        pledgeClass: role === "PLEDGE" ? pledgeClass || null : null,
      },
    });
  } catch {
    return { error: "Failed to create user profile. Please try again." };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
