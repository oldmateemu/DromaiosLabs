import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Above the 20MB intake file limit (MAX_INTAKE_UPLOAD_BYTES) to leave
      // headroom for multipart boundaries/headers, so a valid near-limit scan
      // isn't rejected by the framework before the intake size check runs.
      bodySizeLimit: "25mb"
    }
  }
};

export default nextConfig;
