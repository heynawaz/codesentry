import { auth } from "@/auth";
import { Navbar } from "@/components/navbar";
import Image from "next/image";

const Dashboard = async () => {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={session.user} />
      <main></main>
    </div>
  );
};

export default Dashboard;
