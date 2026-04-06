/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "store.totaline.ar" },
      { protocol: "https", hostname: "**.totaline.ar" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
