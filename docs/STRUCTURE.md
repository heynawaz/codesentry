# Project structure (Next.js)

## Conventions

- **`app/`** – Routes, layouts, `loading.tsx`, and route handlers only. Keep page components thin; fetch in server components and pass data to feature components.
- **`app/actions/`** – Server actions grouped by domain (github, repositories, reviews, sync). Root `app/actions.ts` for auth-related actions (e.g. signOut).
- **`components/layout/`** – App shell: sidebar, theme provider/toggle, auth forms. Use `@/components/layout` barrel for imports.
- **`components/dashboard/`** – Feature components for the dashboard (repos, PR diff viewer, connect/sync).
- **`components/ui/`** – Design system primitives and shared UI (buttons, cards, file-icon, page-loading). No business logic.
- **`lib/`** – Utilities, DB client, and domain logic. `lib/diff/` holds parser and syntax highlighting with a single barrel (`@/lib/diff`).
- **`services/`** – External APIs (GitHub) and AI; called from server actions or API routes.
- **`types/`** – Global TypeScript declarations (`.d.ts`).
- **Path alias** – `@/*` points to project root.

## Imports

- Prefer `@/lib/diff` for diff types and `parseUnifiedDiff` / `getLanguageFromPath`.
- Prefer `@/components/ui/file-icon` for file icons.
- Prefer `@/components/layout` for AppSidebar, ThemeProvider, ThemeToggle.
