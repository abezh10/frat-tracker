"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
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
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
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

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Shield className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              Sigma Chi
            </span>
            <span className="text-xs text-sidebar-foreground/60">
              Frat Tracker
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase tracking-widest text-[0.65rem] text-sidebar-foreground/40">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      className={
                        isActive
                          ? "bg-sidebar-primary/15 text-sidebar-primary font-medium"
                          : ""
                      }
                      render={<Link href={item.href} />}
                    >
                      <item.icon
                        className={isActive ? "text-sidebar-primary" : ""}
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

      <SidebarSeparator />

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-3">
          <Avatar size="default">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs font-medium">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {user.name}
            </span>
            <Badge
              className={
                user.role === "BROTHER"
                  ? "mt-0.5 w-fit bg-sidebar-primary/20 text-sidebar-primary text-[0.6rem] px-1.5 py-0"
                  : "mt-0.5 w-fit bg-blue-500/20 text-blue-400 text-[0.6rem] px-1.5 py-0"
              }
            >
              {user.role}
            </Badge>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex size-8 items-center justify-center rounded-md text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
