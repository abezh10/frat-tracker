import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingGlobeBackground } from "@/components/landing-3d";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background">
      {/* Globe sits behind the entire page */}
      <LandingGlobeBackground />

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 py-24">
        <div className="relative z-10 flex max-w-lg flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyan-500 text-primary-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_20px_50px_-15px_var(--rail-glow)]">
              <span className="text-2xl font-bold leading-none tracking-tight">
                ΣΧ
              </span>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Sigma Chi
            </h1>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground">
              Management System
            </p>
          </div>

          <p className="max-w-md text-base text-muted-foreground md:text-lg">
            The all-in-one platform to track pledges, manage events, collect
            signatures, and keep everything running smoothly, with direct integration
            with WhatsApp.
          </p>

          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary/85 px-6 text-sm font-medium text-primary-foreground shadow-[0_10px_30px_-12px_var(--rail-glow)] transition-all hover:from-primary/95 hover:to-primary/75"
          >
            Log In
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* ── CTA + Footer ─────────────────────────────────── */}
      <footer className="relative z-10 w-full px-4 pb-6 pt-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground/80">
            Connected Everywhere
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            One network
          </h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Track signatures, manage events, and stay connected with brothers
            across every pledge class.
          </p>
          <p className="mt-8 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground/60">
            Sigma Chi &mdash; Tracker &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
