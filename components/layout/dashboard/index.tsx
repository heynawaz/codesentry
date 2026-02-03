import { signOutAction } from "@/app/actions";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";

const Dashboard = async () => {
  const session = await auth();
  return (
    <form action={signOutAction}>
      Welcome to Dashboard
      <Button type="submit">Sign out</Button>
      <p>{session?.user?.email}</p>
      <p>{session?.user?.name}</p>
      <Image loading="eager" src={session?.user?.image ?? ""} alt={session?.user?.name ?? ""} width={100} height={100} />
    </form>
  );
};

export default Dashboard;
