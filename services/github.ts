import { prisma } from "@/lib/db/client";
import { decrypt } from "@/lib/crypto/token";

const GITHUB_API = "https://api.github.com";

type GitHubClient = {
  get<T>(path: string): Promise<T>;
};

async function getToken(userId: string): Promise<string> {
  // #region agent log
  fetch("http://127.0.0.1:7244/ingest/d04d72d8-da72-4238-a884-f8a92fd62073", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "services/github.ts:getToken",
      message: "getToken entry",
      data: { userIdLength: userId?.length ?? 0, userIdPrefix: typeof userId === "string" ? userId.slice(0, 8) : "" },
      timestamp: Date.now(),
      sessionId: "debug-session",
      hypothesisId: "B,C,E",
    }),
  }).catch(() => {});
  // #endregion
  // session.user.id may be DB User id (cuid) or GitHub id (token.sub)
  const account = await prisma.gitHubAccount.findFirst({
    where: {
      OR: [{ userId }, { githubUserId: userId }],
    },
  });
  // #region agent log
  fetch("http://127.0.0.1:7244/ingest/d04d72d8-da72-4238-a884-f8a92fd62073", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "services/github.ts:getToken",
      message: "getToken findFirst result",
      data: {
        found: !!account,
        accountUserIdPrefix: account?.userId?.slice(0, 6) ?? null,
        accountGithubUserId: account?.githubUserId ?? null,
      },
      timestamp: Date.now(),
      sessionId: "debug-session",
      hypothesisId: "B,D,E",
    }),
  }).catch(() => {});
  // #endregion
  if (!account) throw new Error("GitHub account not linked");
  const token = decrypt(account.accessTokenEnc);
  if (!token?.trim()) throw new Error("GitHub token missing or invalid");
  return token;
}

async function getClient(userId: string): Promise<GitHubClient> {
  const token = await getToken(userId);
  return {
    async get<T>(path: string): Promise<T> {
      const res = await fetch(`${GITHUB_API}${path}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`GitHub API ${res.status}: ${text}`);
      }
      return res.json() as Promise<T>;
    },
  };
}

export type RepoListItem = {
  id: number;
  full_name: string;
  name: string;
  default_branch: string;
  private: boolean;
};

export async function listUserRepositories(userId: string): Promise<RepoListItem[]> {
  const client = await getClient(userId);
  const data = await client.get<RepoListItem[]>("/user/repos?per_page=100&sort=updated");
  return Array.isArray(data) ? data : [];
}

export type PrListItem = {
  number: number;
  title: string;
  state: string;
  user: { login: string; avatar_url: string } | null;
  head: { ref: string };
  base: { ref: string };
  diff_url?: string;
  html_url?: string;
};

export async function listPullRequests(userId: string, owner: string, repo: string, state: "open" | "closed" | "all" = "open"): Promise<PrListItem[]> {
  const client = await getClient(userId);
  const path = `/repos/${owner}/${repo}/pulls?state=${state}&per_page=100`;
  const data = await client.get<PrListItem[]>(path);
  return Array.isArray(data) ? data : [];
}

export async function getPullRequestDiff(userId: string, owner: string, repo: string, pullNumber: number): Promise<string> {
  const [client, token] = await Promise.all([getClient(userId), getToken(userId)]);
  const pr = await client.get<{ diff_url: string }>(`/repos/${owner}/${repo}/pulls/${pullNumber}`);
  const diffUrl = pr.diff_url?.replace("https://api.github.com", GITHUB_API);
  if (!diffUrl) throw new Error("No diff URL");
  const res = await fetch(diffUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3.diff",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch diff: ${res.status}`);
  return res.text();
}
