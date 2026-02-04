import { auth } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar user={session.user} />
        <main className="flex-1 overflow-auto px-6 py-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}
