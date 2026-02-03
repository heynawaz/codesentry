import path from "node:path";
import { config } from "dotenv";

// Load .env from project root so DIRECT_DATABASE_URL is available when running via bunx/npx
config({ path: path.resolve(process.cwd(), ".env") });

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI (migrate dev, db push) needs direct Postgres URL. Set DIRECT_DATABASE_URL in .env.
    url: process.env["DIRECT_DATABASE_URL"] ?? env("DATABASE_URL"),
  },
});
