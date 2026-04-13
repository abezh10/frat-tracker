import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8">
        <Link
          href="/"
          className="flex flex-col items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyan-500 text-primary-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_20px_50px_-15px_var(--rail-glow)]">
            <span className="text-xl font-bold leading-none tracking-tight">
              ΣΧ
            </span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Sigma Chi
            </h1>
            <p className="mt-1 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground">
              Chapter Management System
            </p>
          </div>
        </Link>

        {children}
      </div>
    </div>
  );
}
