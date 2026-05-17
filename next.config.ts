import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  images: {
    domains: [
      "github.com",
      "avatars.githubusercontent.com", // add this
      "*.googleusercontent.com",
      "lh3.googleusercontent.com",
    ],
  },
};

export default nextConfig;
