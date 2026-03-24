export type StoryItem = {
  id: string;
  headline: string;
  latest_ref_article_at: string;
  cover_images: string[];
};

export type StoriesResponse = {
  items: StoryItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    has_next: boolean;
  };
};

export type RefArticle = {
  article_id: string;
  url: string;
  title: string;
  update_date: string;
  source: string;
};

export type StoryTimelineEntry = {
  type: string;
  created_at: string;
  event_at: string;
  summary: string;
};

export type StoryDetail = {
  id: string;
  headline: string;
  timeline: StoryTimelineEntry[];
  cover_images: string[];
  latest_ref_article_at: string;
  ref_articles: RefArticle[];
};

function resolveApiUrl(path: string): string {
  if (typeof window !== "undefined") {
    return path;
  }

  const serverApiUrl = process.env.SERVER_API_URL;
  if (!serverApiUrl) {
    throw new Error("SERVER_API_URL is not set");
  }

  return new URL(path, serverApiUrl).toString();
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(resolveApiUrl(path), init);

  if (!response.ok) {
    throw new Error(`Request failed: ${path} (${response.status})`);
  }

  return (await response.json()) as T;
}

export async function fetchStories(
  page = 1,
  options?: { collections?: string[]; search?: string } & RequestInit,
): Promise<StoriesResponse> {
  const { collections, search, ...init } = options || {};
  let url = `/api/stories?page=${page}`;

  if (collections && collections.length > 0) {
    collections.forEach((c) => {
      url += `&collections=${encodeURIComponent(c)}`;
    });
  }

  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }

  return fetchJson<StoriesResponse>(url, init);
}

export async function fetchStoryDetail(
  storyId: string,
  init?: RequestInit,
): Promise<StoryDetail> {
  return fetchJson<StoryDetail>(`/api/story/${storyId}`, init);
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }
  const formatted = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
  
  // Normalize formatting differences between Node.js and browsers.
  // We want to achieve 'Feb 23, 2026 at 12:49 PM'.
  // Chrome uses 'Feb 23, 2026, 12:49 PM' (two commas).
  // Node uses 'Feb 23, 2026 at 12:49 PM' (one comma + ' at ').
  
  const parts = formatted.split(", ");
  if (parts.length === 3) {
    // This is the Chrome case: [Month Day, Year, Time]
    return `${parts[0]}, ${parts[1]} at ${parts[2]}`;
  }
  
  return formatted;
}
