import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000, // 1 year in seconds
    deviceSizes: [400, 640, 800, 1200, 1600],
    imageSizes: [64, 96, 128, 256, 384],
  },
}

export default nextConfig
