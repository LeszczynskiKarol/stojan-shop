// frontend/next.config.ts

/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "a.allegroimg.com",
        pathname: "/",
      },
      {
        protocol: "https",
        hostname: "s3.eu-north-1.amazonaws.com",
        pathname: "/",
      },
      {
        protocol: "https",
        hostname: "piszemy.com.pl.s3.eu-north-1.amazonaws.com",
        pathname: "/",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path",
        destination: process.env.NEXT_PUBLIC_API_URL + "/api/:path",
      },
    ];
  },
};
module.exports = nextConfig;
