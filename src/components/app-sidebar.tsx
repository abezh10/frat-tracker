"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  PenTool,
  Users,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { logout } from "@/app/(auth)/actions";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Tasks", href: "/tasks", icon: CheckSquare },
  { title: "Events", href: "/events", icon: Calendar },
  { title: "Signatures", href: "/signatures", icon: PenTool },
  { title: "Members", href: "/members", icon: Users },
];

interface AppSidebarProps {
  user: {
    name: string;
    role: string;
    email: string;
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function roleBadgeClasses(role: string) {
  switch (role) {
    case "ADMIN":
      return "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/30";
    case "BROTHER":
      return "bg-sidebar-primary/15 text-sidebar-primary ring-1 ring-inset ring-sidebar-primary/30";
    default:
      return "bg-cyan-500/15 text-cyan-300 ring-1 ring-inset ring-cyan-400/30";
  }
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-sidebar-border/80">
      <SidebarHeader className="p-4">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 rounded-lg px-1 py-1 transition-colors"
        >
          <div className="relative flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-sidebar-primary to-cyan-500 text-sidebar-primary-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_10px_30px_-12px_var(--rail-glow)]">
            <span className="text-sm font-bold leading-none tracking-tight">
              ΣΧ
            </span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              Sigma Chi
            </span>
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-sidebar-foreground/45">
              Frat Tracker
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator className="bg-sidebar-border/70" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 pt-1 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-sidebar-foreground/40">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      className={
                        isActive
                          ? "bg-sidebar-primary/15 font-medium text-sidebar-primary shadow-[inset_0_0_0_1px] shadow-sidebar-primary/20"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                      }
                      render={<Link href={item.href} />}
                    >
                      <item.icon
                        className={
                          isActive
                            ? "text-sidebar-primary"
                            : "text-sidebar-foreground/55"
                        }
                      />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="bg-sidebar-border/70" />

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/40 p-2 ring-1 ring-inset ring-sidebar-border/60">
          <Avatar className="size-9 ring-1 ring-inset ring-sidebar-border/70">
            <AvatarFallback className="bg-sidebar-accent text-xs font-medium text-sidebar-foreground">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium leading-tight text-sidebar-foreground">
              {user.name}
            </span>
            <Badge
              className={`mt-1 w-fit px-1.5 py-0 font-mono text-[0.6rem] font-medium uppercase tracking-wider ${roleBadgeClasses(user.role)}`}
            >
              {user.role}
            </Badge>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex size-8 items-center justify-center rounded-md text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label="Log out"
            >
              <LogOut className="size-4" />
              <span className="sr-only">Log out</span>
            </button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
