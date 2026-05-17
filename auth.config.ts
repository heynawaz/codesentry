import { prisma } from "@/lib/db/client";
import { upsertUserAndGitHubAccount } from "@/lib/auth/upsert-user";
import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      authorization: {
        params: { scope: "read:user user:email repo" },
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isSignInPage = nextUrl.pathname.startsWith("/sign-in");
      const isAuthRoute = nextUrl.pathname.startsWith("/api/auth");
      if (isAuthRoute) return true;
      if (isSignInPage) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }
      if (isLoggedIn) return true;
      return false;
    },
    async signIn({ user, account }) {
      if (account?.provider !== "github" || !user) return true;
      try {
        await upsertUserAndGitHubAccount(
          {
            email: user.email ?? null,
            name: user.name ?? null,
            image: user.image ?? null,
            emailVerified: "emailVerified" in user ? (user.emailVerified as Date) ?? null : null,
          },
          account
        );
      } catch (e) {
        console.error("Failed to upsert user:", e);
        return false;
      }
      return true;
    },
    async jwt({ token, account }) {
      // NextAuth sets token.sub to a UUID, not providerAccountId;
      // use account.providerAccountId on first OAuth callback, else lookup by existing token.dbUserId.
      if (prisma?.gitHubAccount) {
        const lookupKey = account?.provider === "github" && (account as { providerAccountId?: string })?.providerAccountId ? String((account as { providerAccountId: string }).providerAccountId) : (token.dbUserId as string | undefined);
        if (!lookupKey) return token;
        const find = () =>
          prisma.gitHubAccount.findFirst({
            where: { OR: [{ userId: lookupKey }, { githubUserId: lookupKey }] },
            select: { userId: true },
          });
        try {
          let ghAccount = await find();
          if (!ghAccount && account?.provider === "github") {
            await new Promise((r) => setTimeout(r, 300));
            ghAccount = await find();
          }
          if (ghAccount) token.dbUserId = ghAccount.userId;
        } catch {
          // DB may be unavailable; keep token without dbUserId
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.dbUserId as string) ?? token.sub ?? "";
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return `${baseUrl}/dashboard`;
    },
  },
};
