import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "pdf-parse", "bcryptjs"],
  outputFileTracingIncludes: {
    "*": ["./prisma/dev.db"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Accept-CH", value: "Sec-CH-Prefers-Color-Scheme" },
          { key: "Critical-CH", value: "Sec-CH-Prefers-Color-Scheme" },
          { key: "Vary", value: "Sec-CH-Prefers-Color-Scheme" },
        ],
      },
    ];
  },
};

export default nextConfig;
