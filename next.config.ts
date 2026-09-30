import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org"
      },
      {
        protocol: "https",
        hostname: "inaturalist-open-data.**.amazonaws.com"
      }
    ]
  },
  cacheComponents: true
};

export default nextConfig;