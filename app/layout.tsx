import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Pokémon Team Builder - Build Your Ultimate Pokémon Team",
  description:
    "Create and optimize your perfect Pokémon team with our interactive team builder. Choose from all generations, analyze type coverage, and build competitive teams for any Pokémon game.",
  keywords:
    "pokemon, team builder, pokemon team, competitive pokemon, pokemon strategy, pokemon types, pokemon generations, team analysis",
  authors: [{ name: "Pokémon Team Builder" }],
  robots: "index, follow",
  icons: {
    icon: [
      { url: "/pokeball.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Pokémon Team Builder",
              description:
                "Interactive Pokémon team builder for creating and optimizing competitive Pokémon teams across all generations",
              url: "https://pokemon-team-builder.com",
              applicationCategory: "GameApplication",
              operatingSystem: "Web Browser",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Organization",
                name: "Pokémon Team Builder",
              },
              keywords:
                "pokemon, team builder, competitive pokemon, pokemon strategy, pokemon types",
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
