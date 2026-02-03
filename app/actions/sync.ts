"use server";

import { auth } from "@/auth";
import { syncPullRequests } from "@/lib/sync-prs";
import { revalidatePath } from "next/cache";

export async function syncRepoPrsAction(repositoryId: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
  try {
    const { count } = await syncPullRequests(session.user.id, repositoryId);
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/repositories/${repositoryId}`);
    return { ok: true, count };
  } catch (e) {
    console.error(e);
    return { ok: false, error: e instanceof Error ? e.message : "Sync failed" };
  }
}
