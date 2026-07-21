import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_HOSTNAME!,
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
}

export default nextConfig
