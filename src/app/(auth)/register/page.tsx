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
    <Card className="w-full border-0 bg-[#121d2e] ring-white/[0.08]">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-xl text-white">Create account</CardTitle>
        <CardDescription className="text-slate-400">
          Join your chapter
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {state?.error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-red-400 ring-1 ring-destructive/20">
              {state.error}
            </div>
          )}

          <input type="hidden" name="role" value={role} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-slate-300">
              Full Name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              required
              autoComplete="name"
              className="h-10 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:border-sigma-gold focus-visible:ring-sigma-gold/30"
            />
          </div>

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
              autoComplete="new-password"
              className="h-10 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:border-sigma-gold focus-visible:ring-sigma-gold/30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-slate-300">Role</Label>
            <Select value={role} onValueChange={(v) => { if (v) setRole(v); }}>
              <SelectTrigger className="h-10 w-full border-white/10 bg-white/5 text-white focus-visible:border-sigma-gold focus-visible:ring-sigma-gold/30">
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
              <Label htmlFor="pledgeClass" className="text-slate-300">
                Pledge Class
              </Label>
              <Input
                id="pledgeClass"
                name="pledgeClass"
                type="text"
                placeholder="e.g. Fall 2026"
                autoComplete="off"
                className="h-10 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:border-sigma-gold focus-visible:ring-sigma-gold/30"
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="mt-2 h-10 w-full bg-sigma-gold font-semibold text-[#0B1526] hover:bg-sigma-gold/90"
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

      <CardFooter className="justify-center border-white/[0.06] bg-white/[0.02] py-4">
        <p className="text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-sigma-gold hover:text-sigma-gold/80 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
