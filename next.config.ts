import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [{ pathname: "/productos/**" }, { pathname: "/*.jpeg" }, { pathname: "/*.png" }],
  },
};

export default nextConfig;
