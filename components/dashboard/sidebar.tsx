import Link from "next/link";
import { BookMarked, CreditCard, FolderGit2, Settings, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Repositories", icon: FolderGit2 },
  { href: "/dashboard/reviews", label: "Reviews", icon: BookMarked },
  { href: "/dashboard/usage", label: "Usage", icon: Star },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

export function DashboardSidebar() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-muted/30">
      <nav className="flex flex-col gap-1 p-3">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium", "text-muted-foreground hover:bg-background hover:text-foreground", "data-[active]:bg-background data-[active]:text-foreground")}>
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
