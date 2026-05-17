"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked, CreditCard, FolderGit2, Settings, Star } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Repositories", icon: FolderGit2 },
  { href: "/dashboard/reviews", label: "Reviews", icon: BookMarked },
  { href: "/dashboard/usage", label: "Usage", icon: Star },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
};

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <motion.aside initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="flex w-56 shrink-0 flex-col border-r border-border bg-muted/20">
      <nav className="flex flex-col gap-0.5 p-3">
        <motion.ul variants={container} initial="hidden" animate="show" className="flex flex-col gap-0.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
            return (
              <motion.li key={href} variants={item}>
                <Link href={href} className={cn("relative flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", isActive ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:bg-background/80 hover:text-foreground")}>
                  <Icon className="size-4 shrink-0" />
                  <span>{label}</span>
                </Link>
              </motion.li>
            );
          })}
        </motion.ul>
      </nav>
    </motion.aside>
  );
}
