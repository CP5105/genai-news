import type { MetadataRoute } from "next";
import { fetchStories } from "@/lib/news-api";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "hourly",
      priority: 1,
    },
  ];

  try {
    const response = await fetchStories(1);
    const storyRoutes = response.items.map((story) => ({
      url: `${SITE_URL}/story/${story.id}`,
      lastModified: new Date(story.latest_timeline_event_at),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...storyRoutes];
  } catch {
    return staticRoutes;
  }
}
