/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/PokeAPI/sprites/**",
      },
    ],
  },
  // Best practice §2.1: optimize barrel file imports for react-icons
  experimental: {
    optimizePackageImports: ["react-icons"],
  },
};

export default nextConfig;
