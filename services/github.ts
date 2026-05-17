import { prisma } from "@/lib/db/client";
import { decrypt } from "@/lib/crypto/token";

const GITHUB_API = "https://api.github.com";

type GitHubClient = {
  get<T>(path: string): Promise<T>;
};

async function getToken(userId: string): Promise<string> {
  // session.user.id may be DB User id (cuid) or GitHub id
  const account = await prisma.gitHubAccount.findFirst({
    where: {
      OR: [{ userId }, { githubUserId: userId }],
    },
  });
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
  const { diff } = await getPullRequestForReview(userId, owner, repo, pullNumber);
  return diff;
}

/** Fetches PR diff and body for AI review. Body is used to understand PR context and intent. */
export async function getPullRequestForReview(
  userId: string,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<{ diff: string; body: string | null }> {
  const token = await getToken(userId);
  const prPath = `/repos/${owner}/${repo}/pulls/${pullNumber}`;
  // Fetch PR (JSON) and diff (raw) in parallel. Use API endpoint for both — diff_url can point to github.com and return HTML.
  const [prRes, diffRes] = await Promise.all([
    fetch(`${GITHUB_API}${prPath}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }),
    fetch(`${GITHUB_API}${prPath}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3.diff",
      },
    }),
  ]);
  if (!prRes.ok) {
    const text = await prRes.text();
    throw new Error(`GitHub API ${prRes.status}: ${text}`);
  }
  if (!diffRes.ok) throw new Error(`Failed to fetch diff: ${diffRes.status}`);
  const pr = (await prRes.json()) as { body: string | null };
  const diff = await diffRes.text();
  return { diff, body: pr.body ?? null };
}

/** Fetch raw file content at the given ref (branch or sha). Returns null if not a file or not found. */
export async function getFileContent(userId: string, owner: string, repo: string, path: string, ref: string): Promise<string | null> {
  const client = await getClient(userId);
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const data = await client.get<{ type: string; content?: string; encoding?: string }>(
    `/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`
  );
  if (data.type !== "file" || !data.content) return null;
  if (data.encoding === "base64") {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }
  return data.content;
}
