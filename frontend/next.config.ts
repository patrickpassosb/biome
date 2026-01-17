import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    // Context7: https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/migrating/from-create-react-app.mdx
    return [
      {
        source: "/metrics/:path*",
        destination: `${process.env.BACKEND_INTERNAL_URL || "http://backend:8080"}/metrics/:path*`,
      },
      {
        source: "/data/:path*",
        destination: `${process.env.BACKEND_INTERNAL_URL || "http://backend:8080"}/data/:path*`,
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
