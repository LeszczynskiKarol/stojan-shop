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
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    return [
      {
        source: "/api/:path",
        destination: process.env.NEXT_PUBLIC_API_URL + "/api/:path",
      },
      {
        source: "/sitemap_index.xml",
        destination: `${backendUrl}/sitemap_index.xml`,
      },
      // Sub-sitemaps
      {
        source: "/sitemap-categories.xml",
        destination: `${backendUrl}/sitemap-categories.xml`,
      },
      {
        source: "/sitemap-products.xml",
        destination: `${backendUrl}/sitemap-products.xml`,
      },
      {
        source: "/sitemap-legal.xml",
        destination: `${backendUrl}/sitemap-legal.xml`,
      },
      {
        source: "/sitemap-manufacturers.xml",
        destination: `${backendUrl}/sitemap-manufacturers.xml`,
      },
      {
        source: "/sitemap-static.xml",
        destination: `${backendUrl}/sitemap-static.xml`,
      },
      // Legacy sitemap
      {
        source: "/sitemap.xml",
        destination: `${backendUrl}/api/sitemap/xml`,
      },
    ];
  },
};
module.exports = nextConfig;
