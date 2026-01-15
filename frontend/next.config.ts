import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/metrics/:path*",
        destination: `${process.env.BACKEND_INTERNAL_URL || "http://backend:8080"}/metrics/:path*`,
      },
      {
        source: "/plan/:path*",
        destination: `${process.env.BACKEND_INTERNAL_URL || "http://backend:8080"}/plan/:path*`,
      },
      {
        source: "/memory/:path*",
        destination: `${process.env.BACKEND_INTERNAL_URL || "http://backend:8080"}/memory/:path*`,
      },
      {
        source: "/agent/:path*",
        destination: `${process.env.BACKEND_INTERNAL_URL || "http://backend:8080"}/agent/:path*`,
      },
    ];
  },
};

export default nextConfig;
