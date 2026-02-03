"use server";

import { auth } from "@/auth";
import * as github from "@/services/github";

export type GetReposResult = { ok: true; repos: github.RepoListItem[] } | { ok: false; error: "not_linked" } | { ok: false; error: "fetch_failed"; message: string };

export async function getReposForConnect(): Promise<GetReposResult> {
  const session = await auth();
  // #region agent log
  const sid = session?.user?.id;
  fetch("http://127.0.0.1:7244/ingest/d04d72d8-da72-4238-a884-f8a92fd62073", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "app/actions/github.ts:getReposForConnect",
      message: "getReposForConnect entry",
      data: {
        hasSession: !!session,
        userIdLength: typeof sid === "string" ? sid.length : 0,
        userIdPrefix: typeof sid === "string" ? sid.slice(0, 4) : String(sid),
      },
      timestamp: Date.now(),
      sessionId: "debug-session",
      hypothesisId: "C",
    }),
  }).catch(() => {});
  // #endregion
  if (!session?.user?.id) return { ok: false, error: "not_linked" };
  try {
    const repos = await github.listUserRepositories(session.user.id);
    // #region agent log
    fetch("http://127.0.0.1:7244/ingest/d04d72d8-da72-4238-a884-f8a92fd62073", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "app/actions/github.ts:getReposForConnect",
        message: "getReposForConnect success",
        data: { repoCount: repos?.length ?? 0 },
        timestamp: Date.now(),
        sessionId: "debug-session",
        hypothesisId: "C",
      }),
    }).catch(() => {});
    // #endregion
    return { ok: true, repos };
  } catch (e) {
    if (e instanceof Error && e.message === "GitHub account not linked") {
      // #region agent log
      fetch("http://127.0.0.1:7244/ingest/d04d72d8-da72-4238-a884-f8a92fd62073", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "app/actions/github.ts:getReposForConnect",
          message: "getReposForConnect not_linked",
          data: { errorMessage: e.message },
          timestamp: Date.now(),
          sessionId: "debug-session",
          hypothesisId: "B,C",
        }),
      }).catch(() => {});
      // #endregion
      return { ok: false, error: "not_linked" };
    }
    const message = e instanceof Error ? e.message : "Failed to load repositories";
    console.error("[getReposForConnect]", e);
    return { ok: false, error: "fetch_failed", message };
  }
}
