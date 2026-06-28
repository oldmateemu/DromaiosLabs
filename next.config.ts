import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Raised to accommodate scanned-document and photo uploads into the
      // intake pathway (multi-page PDFs and phone photos exceed 2mb).
      bodySizeLimit: "20mb"
    }
  }
};

export default nextConfig;
