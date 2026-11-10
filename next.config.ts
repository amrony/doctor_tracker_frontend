import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    const backendOrigin = (process.env.BACKEND_ORIGIN || "http://127.0.0.1:4000").replace(/\/+$/, "");
    return [{ source: "/api/:path*", destination: `${backendOrigin}/api/:path*` }];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
