import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
