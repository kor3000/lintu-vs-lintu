import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org"
      },
      new URL('https://inaturalist-open-data.**.amazonaws.com/photos/**/large.jpg')
    ]
  }
};

export default nextConfig;
