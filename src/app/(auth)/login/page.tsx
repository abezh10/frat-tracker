"use client";

import { useActionState } from "react";
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
import { login } from "../actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <Card className="w-full border-0 bg-[#121d2e] ring-white/[0.08]">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-xl text-white">Welcome back</CardTitle>
        <CardDescription className="text-slate-400">
          Sign in to your account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {state?.error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-red-400 ring-1 ring-destructive/20">
              {state.error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-slate-300">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="h-10 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:border-sigma-gold focus-visible:ring-sigma-gold/30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-slate-300">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="h-10 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:border-sigma-gold focus-visible:ring-sigma-gold/30"
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="mt-2 h-10 w-full bg-sigma-gold font-semibold text-[#0B1526] hover:bg-sigma-gold/90"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-white/[0.06] bg-white/[0.02] py-4">
        <p className="text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-sigma-gold hover:text-sigma-gold/80 hover:underline"
          >
            Register
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
