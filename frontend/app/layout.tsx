import type { Metadata } from "next";
import { Chakra_Petch, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "@/app/globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import CookieConsentManager from "@/components/privacy/CookieConsentManager";
import PrivacyScriptLoader from "@/components/privacy/PrivacyScriptLoader";
import { METADATA_BASE, SITE_URL } from "@/lib/site";

const display = Chakra_Petch({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: METADATA_BASE,
  title: "Slatedex — Pokémon Team Builder",
  description:
    "Build your ideal Pokémon team with Slatedex. Analyze type coverage, find defensive weaknesses, and get smart team recommendations across all nine generations.",
  keywords:
    "slatedex, pokemon, team builder, pokemon team, competitive pokemon, pokemon strategy, pokemon types, pokemon generations, team analysis, type coverage",
  authors: [{ name: "Slatedex" }],
  robots: "index, follow",
  icons: {
    icon: [{ url: "/pokeball.svg", type: "image/svg+xml" }],
    shortcut: "/pokeball.svg",
  },
  manifest: "/site.webmanifest",
};

const themeInitScript = `
  (function () {
    try {
      var savedTheme = localStorage.getItem("theme");
      var systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var resolvedTheme = savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : (systemPrefersDark ? "dark" : "light");

      var root = document.documentElement;
      root.dataset.theme = resolvedTheme;
      root.style.colorScheme = resolvedTheme;

      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", resolvedTheme === "dark" ? "#060914" : "#f3ecde");
    } catch (e) {
      document.documentElement.dataset.theme = "dark";
      document.documentElement.style.colorScheme = "dark";
    }
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      style={{ colorScheme: "dark" }}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#060914" />
        <link rel="preconnect" href="https://raw.githubusercontent.com" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Slatedex",
              description:
                "Slatedex — a tactical Pokémon team builder for analyzing type coverage, finding team weaknesses, and building optimal competitive teams across all nine generations.",
              url: SITE_URL,
              applicationCategory: "GameApplication",
              operatingSystem: "Web Browser",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              author: { "@type": "Organization", name: "Slatedex" },
              keywords: "slatedex, pokemon, team builder, competitive pokemon, pokemon strategy, type coverage",
            }),
          }}
        />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>{children}</AuthProvider>
        <PrivacyScriptLoader />
        <CookieConsentManager />
      </body>
    </html>
  );
}
