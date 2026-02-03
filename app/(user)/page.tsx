import { auth } from "@/auth";
import Dashboard from "@/components/layout/dashboard";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session?.user) redirect("/sign-in");

  return <Dashboard />;
}
