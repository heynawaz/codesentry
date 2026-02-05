"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/navbar/user-menu";
import { Shield } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { User } from "next-auth";

export function Navbar({ user }: { user: User }) {
  return (
    <motion.header initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25, ease: "easeOut" }} className="sticky top-0 z-50 w-full border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
        <Link href="/" className="flex cursor-pointer items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-90">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Shield className="size-4" />
          </motion.div>
          <span className="hidden sm:inline-block">CodeSentry</span>
        </Link>
        <div className="flex-1" />
        <nav className="flex items-center gap-1">
          <ThemeToggle />
          <UserMenu user={user} />
        </nav>
      </div>
    </motion.header>
  );
}
