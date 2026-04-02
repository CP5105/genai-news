import StoryFeed from "@/components/story-feed";
import { type StoriesResponse, fetchStories } from "@/lib/news-api";
import { SOURCE_MAP } from "@/lib/constants";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export default async function Home() {
  let stories: StoriesResponse | null = null;
  let errorMessage = "";
  
  const defaultCollections = Object.values(SOURCE_MAP);

  try {
    stories = await fetchStories(1, { cache: "no-store" });
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Could not load stories";
  }

  if (errorMessage) {
    return (
      <main className="mx-auto w-[min(1100px,94vw)] py-10">
        <section className="error-state">
          <p className="error-state-title">Backend unavailable</p>
          <p>{errorMessage}</p>
        </section>
      </main>
    );
  }

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
  };

  return (
    <main className="mx-auto w-[min(1100px,94vw)] py-10">
      <h1 className="sr-only">GenAI News: Latest Generative AI stories</h1>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <StoryFeed
        initialItems={stories?.items ?? []}
        initialPage={stories?.pagination.page ?? 1}
        initialHasNext={stories?.pagination.has_next ?? false}
        initialCollections={defaultCollections}
      />
    </main>
  );
}
