#!/usr/bin/env node
/**
 * Ensures Prisma client is generated before dev/build.
 * Requires Node 20+ (Prisma 7 fails on Node 18 due to ESM).
 */
const { execSync } = require("child_process");
const major = parseInt(process.version.slice(1).split(".")[0], 10);

if (major < 20) {
  console.error("\n❌ Prisma generate requires Node 20+. Current:", process.version);
  console.error("   Run: nvm use 24  (or fnm use 20)  then try again.\n");
  process.exit(1);
}

try {
  execSync("prisma generate", {
    stdio: "inherit",
    cwd: process.cwd(),
  });
} catch {
  process.exit(1);
}
