import { Shield } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark flex min-h-screen flex-col items-center justify-center bg-[#0B1526] px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(30,58,95,0.4)_0%,_transparent_60%)]" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-sigma-gold/10 ring-1 ring-sigma-gold/20">
            <Shield className="size-8 text-sigma-gold" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Sigma Chi
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Chapter Management System
            </p>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
