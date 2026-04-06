import { createFileRoute } from "@tanstack/react-router";
import { GENERATION_META, getGenerationSlug } from "@/lib/pokemon";
import { SITE_URL } from "@/lib/site";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap/xml")({
  server: {
    handlers: {
      GET: () => {
        const lastModified = new Date().toISOString();
        const urls = [
          SITE_URL,
          `${SITE_URL}/play`,
          `${SITE_URL}/privacy`,
          `${SITE_URL}/terms`,
          ...GENERATION_META.map((gen) => `${SITE_URL}/game/${getGenerationSlug(gen.generation)}`),
        ];

        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map(
            (url) => `  <url><loc>${escapeXml(url)}</loc><lastmod>${lastModified}</lastmod></url>`
          )
          .join("\n")}\n</urlset>`;

        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
          },
        });
      },
    },
  },
});
