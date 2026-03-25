/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === "production";

function normalizeExternalApiUrl(rawUrl) {
  if (!rawUrl) return "http://localhost:3001";

  const unquoted = rawUrl.replace(/^['"]+|['"]+$/g, "");
  const withProtocol =
    !unquoted.startsWith("http://") && !unquoted.startsWith("https://")
      ? `https://${unquoted}`
      : unquoted;

  let normalized = withProtocol.replace(/\/+$/, "");
  if (/(\/api)+$/i.test(normalized)) {
    normalized = normalized.replace(/(\/api)+$/i, "");
  }

  return normalized;
}

const backendProxyTarget = normalizeExternalApiUrl(process.env.NEXT_PUBLIC_API_URL);

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/PokeAPI/sprites/**",
      },
      // OAuth provider avatars (Google, GitHub, etc.)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
    ],
  },
  // Best practice §2.1: optimize barrel file imports for react-icons
  experimental: {
    optimizePackageImports: ["react-icons", "@dnd-kit/core", "@dnd-kit/sortable"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/_backend/:path*",
        destination: `${backendProxyTarget}/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/game/1", destination: "/game/gen1", permanent: true },
      { source: "/game/2", destination: "/game/gen2", permanent: true },
      { source: "/game/3", destination: "/game/gen3", permanent: true },
      { source: "/game/4", destination: "/game/gen4", permanent: true },
      { source: "/game/5", destination: "/game/gen5", permanent: true },
      { source: "/game/6", destination: "/game/gen6", permanent: true },
      { source: "/game/7", destination: "/game/gen7", permanent: true },
      { source: "/game/8", destination: "/game/gen8", permanent: true },
      { source: "/game/9", destination: "/game/gen9", permanent: true },
    ];
  },
};

export default nextConfig;
