import { prisma } from "@/lib/db/client";
import { encrypt } from "@/lib/crypto/token";
import type { Account } from "next-auth";

export type OAuthUser = {
  id?: string;
  email: string | null;
  name: string | null;
  image: string | null;
  emailVerified?: Date | null;
};

/**
 * Creates or updates User and GitHubAccount after GitHub OAuth.
 * Returns the DB User id for use in session.
 */
export async function upsertUserAndGitHubAccount(user: OAuthUser, account: Account): Promise<{ userId: string }> {
  if (account.provider !== "github") {
    throw new Error("Only GitHub account linking is supported");
  }

  const profile = account as Account & { id?: string; login?: string; avatar_url?: string };
  // Use providerAccountId first so we match NextAuth's token.sub for jwt lookup
  const rawId = account.providerAccountId ?? profile.id;
  if (!rawId) throw new Error("GitHub account id missing from OAuth response");
  const githubUserId = String(rawId);
  const username = profile.login ?? user.name ?? "unknown";
  const avatarUrl = profile.avatar_url ?? user.image ?? null;
  const accessToken = account.access_token;
  // #region agent log
  fetch("http://127.0.0.1:7244/ingest/d04d72d8-da72-4238-a884-f8a92fd62073", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "lib/auth/upsert-user.ts:upsertUserAndGitHubAccount",
      message: "upsert entry",
      data: { githubUserId, hasAccessToken: !!(accessToken && typeof accessToken === "string") },
      timestamp: Date.now(),
      sessionId: "debug-session",
      hypothesisId: "A",
    }),
  }).catch(() => {});
  // #endregion
  if (!accessToken || typeof accessToken !== "string") {
    throw new Error("GitHub access token missing from OAuth response");
  }
  const accessTokenEnc = encrypt(accessToken);
  const refreshTokenEnc = account.refresh_token ? encrypt(account.refresh_token) : null;
  const tokenExpiresAt = account.expires_at ? new Date(account.expires_at * 1000) : null;

  const email = user.email?.trim() || null;
  const stableEmail = email ?? `gh-${githubUserId}@placeholder.codesentry.local`;

  let dbUser = await prisma.user.findFirst({
    where: {
      OR: [...(email ? [{ email }] : []), { githubAccounts: { some: { githubUserId } } }],
    },
    include: { githubAccounts: true },
  });

  if (dbUser) {
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        name: user.name ?? undefined,
        image: user.image ?? undefined,
        email: dbUser.email || stableEmail,
        emailVerified: user.emailVerified ?? undefined,
      },
    });
    const gh = dbUser.githubAccounts[0];
    if (gh) {
      await prisma.gitHubAccount.update({
        where: { id: gh.id },
        data: {
          username,
          avatarUrl,
          accessTokenEnc,
          refreshTokenEnc,
          tokenExpiresAt,
        },
      });
    } else {
      await prisma.gitHubAccount.create({
        data: {
          userId: dbUser.id,
          githubUserId,
          username,
          avatarUrl,
          accessTokenEnc,
          refreshTokenEnc,
          tokenExpiresAt,
        },
      });
    }
  } else {
    dbUser = await prisma.user.create({
      data: {
        email: stableEmail,
        name: user.name ?? undefined,
        image: user.image ?? undefined,
        emailVerified: user.emailVerified ?? undefined,
        githubAccounts: {
          create: {
            githubUserId,
            username,
            avatarUrl,
            accessTokenEnc,
            refreshTokenEnc,
            tokenExpiresAt,
          },
        },
      },
      include: { githubAccounts: true },
    });
  }

  // #region agent log
  fetch("http://127.0.0.1:7244/ingest/d04d72d8-da72-4238-a884-f8a92fd62073", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "lib/auth/upsert-user.ts:upsertUserAndGitHubAccount",
      message: "upsert exit",
      data: { userIdPrefix: dbUser.id.slice(0, 8), githubUserId },
      timestamp: Date.now(),
      sessionId: "debug-session",
      hypothesisId: "A,D",
    }),
  }).catch(() => {});
  // #endregion
  return { userId: dbUser.id };
}
