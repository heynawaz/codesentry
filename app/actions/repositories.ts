"use server";

import { auth } from "@/auth";
import { connectRepositories } from "@/lib/repositories";
import { revalidatePath } from "next/cache";

export async function connectReposAction(repoIds: number[]) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
  const { connected, failed } = await connectRepositories(session.user.id, repoIds);
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { ok: true, connected, failed };
}

export async function disconnectRepoAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
  const repositoryId = formData.get("repositoryId");
  if (typeof repositoryId !== "string") return { ok: false, error: "Bad request" };
  const { disconnectRepository } = await import("@/lib/repositories");
  await disconnectRepository(session.user.id, repositoryId);
  revalidatePath("/dashboard");
  return { ok: true };
}
