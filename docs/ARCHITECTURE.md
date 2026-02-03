# AI Code Review Assistant – Architecture

## Folder structure

```
app/
  (auth)/           # Sign-in (public)
  (dashboard)/      # Authenticated app
    dashboard/      # Routes: /dashboard, /dashboard/reviews, usage, billing, settings
    repositories/[id]/
  (user)/           # Root redirect (→ /dashboard)
  actions/          # Server actions (repositories, github, sync, etc.)
  api/
    auth/           # NextAuth
    reviews/        # POST: trigger AI review for a PR
lib/
  auth/             # upsert-user (persist User + GitHubAccount after OAuth)
  crypto/            # Token encryption (GitHub access token)
  db/
    client.ts        # Prisma client singleton (import from @/lib/db/client)
  generated/prisma/  # Generated Prisma client (output of prisma generate)
  repositories.ts    # Connect/disconnect repos, get connected repos
  reviews.ts         # Create review (call AI service, persist)
  utils.ts
services/
  github.ts          # GitHub API: list repos, list PRs, get PR diff
  ai-review.ts       # AI review stub (TODO: replace with OpenAI/LLM)
components/
  dashboard/         # Sidebar, ConnectReposButton, RepoList, SyncPrsButton
  navbar/
prisma/
  schema.prisma
  seed.ts            # Subscription plans (free, pro, team)
```

## Authentication flow

1. GitHub OAuth (NextAuth) → sign-in callback runs.
2. `upsertUserAndGitHubAccount`: create/update `User` and `GitHubAccount`; store encrypted access token.
3. JWT callback: set `token.dbUserId` from `GitHubAccount.userId`.
4. Session callback: `session.user.id` = DB User id.
5. Redirect to `/dashboard`.

## Database

- **User** – app user (email, name, image).
- **GitHubAccount** – one per user; stores encrypted token, GitHub userId, username, avatar.
- **Repository** – connected repo (githubRepoId, fullName, lastScannedAt).
- **UserRepository** – many-to-many User ↔ Repository.
- **PullRequest** – PR metadata (repositoryId, githubPrId, title, state, author, diffUrl, etc.).
- **CodeReview** – AI result (pullRequestId, qualityScore, summary, rawResponse).
- **CodeReviewIssue** – security/improvement items (kind, title, severity, filePath, lineStart/End, snippet).
- **SubscriptionPlan** – free / pro / team (seed required).
- **Subscription** – user’s current plan (default free).

## GitHub integration

- **List repos**: `services/github.listUserRepositories(userId)`.
- **Connect**: `lib/repositories.connectRepositories(userId, repoIds)` (creates Repository + UserRepository).
- **List PRs**: `services/github.listPullRequests(userId, owner, repo)`.
- **Sync PRs**: `lib/sync-prs.syncPullRequests(userId, repositoryId)` – fetch open PRs from GitHub, upsert into DB, set lastScannedAt.
- **Get diff**: `services/github.getPullRequestDiff(userId, owner, repo, pullNumber)`.

## AI review pipeline (stub)

- **Service**: `services/ai-review.reviewPullRequestDiff(diff)` → returns mocked `ReviewResult` (qualityScore, summary, securityIssues, improvements).
- **TODO**: Replace with real OpenAI (or other) API; keep the same `ReviewResult` shape.
- **Persistence**: `lib/reviews.createReview({ pullRequestId, diff })` – calls AI service, then creates `CodeReview` + `CodeReviewIssue` rows.
- **API**: `POST /api/reviews` with `{ pullRequestId }` – loads PR, fetches diff, runs `createReview`, returns `{ id, qualityScore }`.

## Environment

- `DATABASE_URL` – PostgreSQL connection string.
- `ENCRYPTION_KEY` – 32+ character secret for encrypting GitHub tokens.
- `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `AUTH_SECRET` – NextAuth (existing).

## Commands

- `bun run db:generate` – generate Prisma client (requires Node ≥20).
- `bun run db:push` – push schema to DB.
- `bun run db:seed` – seed subscription plans.
