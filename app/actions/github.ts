"use server";

import { auth } from "@/auth";
import * as github from "@/services/github";

export type GetReposResult = { ok: true; repos: github.RepoListItem[] } | { ok: false; error: "not_linked" } | { ok: false; error: "fetch_failed"; message: string };

export async function getReposForConnect(): Promise<GetReposResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "not_linked" };
  try {
    const repos = await github.listUserRepositories(session.user.id);
    return { ok: true, repos };
  } catch (e) {
    if (e instanceof Error && e.message === "GitHub account not linked") {
      return { ok: false, error: "not_linked" };
    }
    const message = e instanceof Error ? e.message : "Failed to load repositories";
    console.error("[getReposForConnect]", e);
    return { ok: false, error: "fetch_failed", message };
  }
}
