/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/category/kids", destination: "/category/new", permanent: true },
      { source: "/category/teens", destination: "/category/new", permanent: false },
    ];
  },
};

export default nextConfig;
