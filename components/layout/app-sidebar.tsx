"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { BookMarked, CreditCard, FolderGit2, LogOut, Settings, Shield, Star, MoreVertical, User as UserIcon, Bell, Moon, Sun, PanelLeft, PanelLeftClose } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions";
import type { User as AuthUser } from "next-auth";

const SIDEBAR_WIDTH_EXPANDED = 256;
const SIDEBAR_WIDTH_COLLAPSED = 64;

const nav = [
  { href: "/dashboard", label: "Repositories", icon: FolderGit2 },
  { href: "/dashboard/reviews", label: "Reviews", icon: BookMarked },
  { href: "/dashboard/usage", label: "Usage", icon: Star },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

// /dashboard/repositories/* should also highlight Repositories
function isRepositoriesActive(pathname: string, href: string) {
  if (href !== "/dashboard") return pathname.startsWith(href);
  return pathname === "/dashboard" || pathname === "/dashboard/" || pathname.startsWith("/dashboard/repositories");
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
};

const item = {
  hidden: { opacity: 0, x: -6 },
  show: { opacity: 1, x: 0 },
};

type AppSidebarProps = {
  user: AuthUser;
  companyName?: string;
};

export function AppSidebar({ user, companyName = "CodeSentry" }: AppSidebarProps) {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const navLink = (href: string, label: string, Icon: typeof FolderGit2) => {
    const isActive = isRepositoriesActive(pathname, href);
    const content = (
      <Link href={href} className={cn("flex cursor-pointer items-center rounded-lg text-sm font-medium transition-colors", collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-3 py-2.5", isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
        <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", isActive ? "bg-background" : "bg-transparent")}>
          <Icon className="size-4" />
        </div>
        {!collapsed && <span>{label}</span>}
      </Link>
    );
    if (collapsed) {
      return (
        <motion.li key={href} variants={item}>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {label}
            </TooltipContent>
          </Tooltip>
        </motion.li>
      );
    }
    return (
      <motion.li key={href} variants={item}>
        {content}
      </motion.li>
    );
  };

  return (
    <motion.aside initial={false} animate={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED }} transition={{ type: "spring", stiffness: 400, damping: 35 }} className="flex h-screen shrink-0 flex-col overflow-hidden border-r border-border bg-card">
      {/* Company header */}
      <div className={cn("flex h-16 shrink-0 items-center border-b border-border", collapsed ? "justify-center px-0" : "gap-2.5 px-4")}>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm" aria-hidden>
          <Shield className="size-4" />
        </div>
        {!collapsed && <span className="text-lg font-semibold tracking-tight truncate">{companyName}</span>}
      </div>

      {/* Primary nav - scrolls if needed so footer stays at bottom */}
      <nav className="min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 pt-4 flex">
        <motion.ul variants={container} initial="hidden" animate="show" className="flex flex-col gap-0.5">
          {nav.map(({ href, label, icon }) => navLink(href, label, icon))}
          {/* Theme toggle */}
          <motion.li variants={item} className="mt-1">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => mounted && setTheme(isDark ? "light" : "dark")} className="flex w-full cursor-pointer items-center justify-center rounded-lg px-0 py-2.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground" aria-label="Toggle theme">
                    <div className="flex size-8 items-center justify-center rounded-full bg-transparent">{mounted ? isDark ? <Moon className="size-4" /> : <Sun className="size-4" /> : <Sun className="size-4" />}</div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  Theme
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-full bg-transparent">{mounted ? isDark ? <Moon className="size-4" /> : <Sun className="size-4" /> : <Sun className="size-4" />}</div>
                  <span>Theme</span>
                </div>
                {mounted && <Switch checked={isDark} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} aria-label="Toggle dark mode" />}
              </div>
            )}
          </motion.li>
        </motion.ul>
      </nav>

      {/* Footer: collapse toggle + user - stays at bottom */}
      <div className={cn("shrink-0 p-2", collapsed && "flex justify-center")}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={cn("h-9 w-9", collapsed && "mx-0")} onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
              {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
          </TooltipContent>
        </Tooltip>
      </div>

      <Separator className="shrink-0" />

      {/* User profile block - footer. Dropdown only after mount to avoid Radix ID hydration mismatch. */}
      <div className={cn("shrink-0 p-3", collapsed && "flex justify-center px-2")}>
        {mounted ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={cn("flex cursor-pointer items-center rounded-lg transition-colors hover:bg-muted", collapsed ? "justify-center p-2" : "w-full gap-3 px-3 py-2.5 text-left")}>
              <Avatar className="size-9 shrink-0 ring-2 ring-border">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ""} />
                <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">{user?.name?.slice(0, 2)?.toUpperCase() ?? "U"}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{user?.name ?? "User"}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email ?? "user@example.com"}</p>
                  </div>
                  <MoreVertical className="size-4 shrink-0 text-muted-foreground" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right" className="w-62 rounded-lg">
            <div className="flex items-center gap-3 px-3 py-3">
              <Avatar className="size-8 shrink-0 ring-2 ring-border">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ""} />
                <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">{user?.name?.slice(0, 2)?.toUpperCase() ?? "U"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user?.name ?? "User"}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email ?? "user@example.com"}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="flex cursor-pointer items-center gap-2">
                <UserIcon className="size-4" />
                Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/billing" className="flex cursor-pointer items-center gap-2">
                <CreditCard className="size-4" />
                Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="flex cursor-pointer items-center gap-2">
                <Bell className="size-4" />
                Notifications
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className="p-0">
              <form action={signOutAction} className="w-full">
                <button type="submit" className="flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-left text-sm outline-none hover:bg-destructive/10 focus:bg-destructive/10">
                  <LogOut className="size-4" />
                  Log out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        ) : (
          <div className={cn("flex cursor-pointer items-center rounded-lg transition-colors hover:bg-muted", collapsed ? "justify-center p-2" : "w-full gap-3 px-3 py-2.5 text-left")}>
            <Avatar className="size-9 shrink-0 ring-2 ring-border">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ""} />
              <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">{user?.name?.slice(0, 2)?.toUpperCase() ?? "U"}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{user?.name ?? "User"}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email ?? "user@example.com"}</p>
                </div>
                <MoreVertical className="size-4 shrink-0 text-muted-foreground" />
              </>
            )}
          </div>
        )}
      </div>
    </motion.aside>
  );
}
