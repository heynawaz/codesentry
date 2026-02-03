import "dotenv/config";
import { prisma } from "../lib/db/client";

async function main() {
  await prisma.subscriptionPlan.upsert({
    where: { id: "free" },
    create: {
      id: "free",
      name: "Free",
      description: "For individuals and small projects",
      priceCents: 0,
      reposLimit: 1,
      reviewsPerMonth: 10,
    },
    update: {},
  });
  await prisma.subscriptionPlan.upsert({
    where: { id: "pro" },
    create: {
      id: "pro",
      name: "Pro",
      description: "For growing teams",
      priceCents: 2900,
      reposLimit: 10,
      reviewsPerMonth: 100,
    },
    update: {},
  });
  await prisma.subscriptionPlan.upsert({
    where: { id: "team" },
    create: {
      id: "team",
      name: "Team",
      description: "For organizations",
      priceCents: 9900,
      reposLimit: 100,
      reviewsPerMonth: null,
    },
    update: {},
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
