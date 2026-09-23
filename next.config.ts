import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Default is 1MB; image uploads (logo, login photo, product photos) go
  // through Server Actions and need headroom above their stated max size.
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
}

export default nextConfig
