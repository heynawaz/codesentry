import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/navbar/user-menu";
import { Shield } from "lucide-react";
import Link from "next/link";
import type { User } from "next-auth";

export function Navbar({ user }: { user: User }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Shield className="size-3.5" />
          </div>
          <span className="hidden sm:inline-block">CodeSentry</span>
        </Link>
        <div className="flex-1" />
        <nav className="flex items-center gap-1">
          <ThemeToggle />
          <UserMenu user={user} />
        </nav>
      </div>
    </header>
  );
}
