import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/40 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/30">
      <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
      <Separator orientation="vertical" className="mr-1 h-5 bg-border/60" />
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground/70">
          /
        </span>
        <h1 className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h1>
      </div>
    </header>
  );
}
