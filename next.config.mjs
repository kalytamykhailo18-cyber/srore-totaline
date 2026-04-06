/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "store.totaline.ar" },
      { protocol: "https", hostname: "**.totaline.ar" },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
