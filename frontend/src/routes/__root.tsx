/// <reference types="vite/client" />
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { ReactNode } from "react";
import CookieConsentManager from "@/components/privacy/CookieConsentManager";
import PrivacyScriptLoader from "@/components/privacy/PrivacyScriptLoader";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { FeedbackProvider } from "@/components/feedback/FeedbackWidget";
import NavigationProgress from "@/components/ui/NavigationProgress";
import PageTransitionWrapper from "@/components/ui/PageTransitionWrapper";
import { METADATA_BASE, SITE_URL } from "@/lib/site";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import appCss from "~/styles/globals.css?url";

const themeInitScript = `(function () {
  try {
    var savedTheme = localStorage.getItem("theme");
    var systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var resolvedTheme = savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : (systemPrefersDark ? "dark" : "light");
    var root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
    document.cookie = "theme=" + resolvedTheme + "; path=/; max-age=31536000; samesite=lax";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolvedTheme === "dark" ? "#060914" : "#f3ecde");
  } catch (e) {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.style.colorScheme = "dark";
  }
})();`;

const webAppJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Slatedex",
  description:
    "Slatedex - a tactical Pokemon team builder for analyzing type coverage, finding team weaknesses, and building optimal competitive teams across all nine generations.",
  url: SITE_URL,
  applicationCategory: "GameApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Organization", name: "Slatedex" },
  keywords: "slatedex, pokemon, team builder, competitive pokemon, pokemon strategy, type coverage",
});

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#060914" },
      {
        title: "Slatedex - Pokemon Team Builder",
      },
      {
        name: "description",
        content:
          "Build your ideal Pokemon team with Slatedex. Analyze type coverage, find defensive weaknesses, and get smart team recommendations across all nine generations.",
      },
      { name: "robots", content: "index, follow" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap",
      },
      { rel: "preconnect", href: "https://raw.githubusercontent.com" },
      { rel: "icon", href: "/pokeball.svg", type: "image/svg+xml" },
      { rel: "shortcut icon", href: "/pokeball.svg" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
  }),
  errorComponent: (props) => (
    <RootDocument>
      <DefaultCatchBoundary {...props} />
    </RootDocument>
  ),
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <NavigationProgress />
      <AuthProvider>
        <FeedbackProvider>
          <PageTransitionWrapper>
            <Outlet />
          </PageTransitionWrapper>
        </FeedbackProvider>
      </AuthProvider>
      <PrivacyScriptLoader />
      <CookieConsentManager />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const search = useRouterState({ select: (state) => state.location.searchStr });
  const currentUrl = `${SITE_URL}${pathname}${search ?? ""}`;

  return (
    <html
      lang="en"
      data-theme="dark"
      data-scroll-behavior="smooth"
      style={{
        colorScheme: "dark",
        ["--font-display" as string]: '"Chakra Petch"',
        ["--font-body" as string]: '"IBM Plex Sans"',
        ["--font-mono" as string]: '"JetBrains Mono"',
      }}
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: webAppJsonLd }} />
        <link rel="canonical" href={currentUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:site_name" content="Slatedex" />
        <meta property="og:title" content="Slatedex - Pokemon Team Builder" />
        <meta property="og:description" content="Build your ideal Pokemon team with Slatedex." />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Slatedex - Pokemon Team Builder" />
        <meta name="twitter:description" content="Build your ideal Pokemon team with Slatedex." />
        <meta name="metadata-base" content={String(METADATA_BASE)} />
      </head>
      <body className="font-body antialiased">{children}<Scripts />{import.meta.env.DEV ? <><TanStackRouterDevtools position="bottom-right" /><ReactQueryDevtools buttonPosition="bottom-left" /></> : null}</body>
    </html>
  );
}
