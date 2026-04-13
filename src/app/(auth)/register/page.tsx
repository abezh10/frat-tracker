"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { register } from "../actions";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, null);
  const [role, setRole] = useState("PLEDGE");

  return (
    <Card className="w-full border-border/60 bg-card/40 backdrop-blur-2xl shadow-[0_20px_80px_-30px_var(--rail-glow)]">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-xl">Create account</CardTitle>
        <CardDescription>Join your chapter</CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {state?.error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive ring-1 ring-inset ring-destructive/25">
              {state.error}
            </div>
          )}

          <input type="hidden" name="role" value={role} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              required
              autoComplete="name"
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="new-password"
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Role</Label>
            <Select
              value={role}
              onValueChange={(v) => {
                if (v) setRole(v);
              }}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BROTHER">Brother</SelectItem>
                <SelectItem value="PLEDGE">Pledge</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role === "PLEDGE" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="pledgeClass">Pledge Class</Label>
              <Input
                id="pledgeClass"
                name="pledgeClass"
                type="text"
                placeholder="e.g. Fall 2026"
                autoComplete="off"
                className="h-10"
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="mt-2 h-10 w-full bg-gradient-to-r from-primary to-primary/85 font-medium text-primary-foreground shadow-[0_10px_30px_-12px_var(--rail-glow)] hover:from-primary/95 hover:to-primary/75"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating account…
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t border-border/60 bg-muted/20 py-4">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
