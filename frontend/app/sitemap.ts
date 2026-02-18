import type { MetadataRoute } from "next";
import { GENERATION_META } from "@/lib/pokemon";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const generationPages: MetadataRoute.Sitemap = GENERATION_META.map((gen) => ({
    url: `${SITE_URL}/game/${gen.generation}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...generationPages];
}
