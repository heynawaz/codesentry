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

export type GetFileContentResult = { ok: true; content: string } | { ok: false; error: string };

export async function getFileContentAction(repoFullName: string, path: string, ref: string): Promise<GetFileContentResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
  if (!ref?.trim()) return { ok: false, error: "No ref provided" };
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) return { ok: false, error: "Invalid repo" };
  try {
    const content = await github.getFileContent(session.user.id, owner, repo, path, ref);
    if (content === null) return { ok: false, error: "File not found or not available for this branch." };
    return { ok: true, content };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load file";
    console.error("[getFileContentAction]", e);
    // Don't expose raw API responses (e.g. GitHub 404 JSON) to the UI
    const genericMessage =
      message.includes("404") || message.includes("Not Found")
        ? "File not found or not available for this branch."
        : "Couldn't load full file. Try again or view changes only.";
    return { ok: false, error: genericMessage };
  }
}
