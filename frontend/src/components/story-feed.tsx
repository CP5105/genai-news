"use client";

import { type KeyboardEvent, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { type StoryItem, fetchStories, formatDate } from "@/lib/news-api";
import {
  STORY_READ_STATE_CHANGE_EVENT,
  STORY_READ_STATE_STORAGE_KEY,
  type StoryReadState,
  readStoryReadState,
} from "@/lib/story-read-state";
import StoryImageCarousel from "@/components/story-image-carousel";
import SourceDropdown from "@/components/source-dropdown";
import { SOURCE_MAP } from "@/lib/constants";

type PersistedStoryFeedState = {
  version: 5;
  items: StoryItem[];
  page: number;
  hasNext: boolean;
  selectedCollections: string[];
  searchQuery: string;
  searchInput: string;
  activeImageByStory: Record<string, number>;
  scrollY?: number;
};

const STORY_FEED_STORAGE_KEY = "genai-news:story-feed-state";

function readPersistedStoryFeedState(): PersistedStoryFeedState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(STORY_FEED_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedStoryFeedState;
    if (parsed.version !== 5) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function savePersistedStoryFeedState(state: PersistedStoryFeedState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      STORY_FEED_STORAGE_KEY,
      JSON.stringify(state),
    );
  } catch {
    // Ignore storage quota and privacy-mode failures.
  }
}

type StoryFeedProps = {
  initialItems: StoryItem[];
  initialPage: number;
  initialHasNext: boolean;
  initialCollections?: string[];
};

export default function StoryFeed({
  initialItems,
  initialPage,
  initialHasNext,
  initialCollections = [],
}: StoryFeedProps) {
  const router = useRouter();
  const [items, setItems] = useState<StoryItem[]>(initialItems);
  const [page, setPage] = useState(initialPage);
  const [hasNext, setHasNext] = useState(initialHasNext);
  const [selectedCollections, setSelectedCollections] = useState<string[]>(initialCollections);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [storyReadState, setStoryReadState] = useState<StoryReadState>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [activeImageByStory, setActiveImageByStory] = useState<
    Record<string, number>
  >({});
  const [hasHydratedState, setHasHydratedState] = useState(false);
  const [pendingScrollRestore, setPendingScrollRestore] = useState<number | null>(
    null,
  );

  const previousFilterKeyRef = useRef<string | null>(null);

  const setActiveImage = (storyId: string, index: number) => {
    setActiveImageByStory((prev) => ({ ...prev, [storyId]: index }));
  };

  const buildPersistedState = useCallback(
    (scrollY?: number): PersistedStoryFeedState => ({
      version: 5,
      items,
      page,
      hasNext,
      selectedCollections,
      searchQuery,
      searchInput,
      activeImageByStory,
      scrollY,
    }),
    [
      activeImageByStory,
      hasNext,
      items,
      page,
      searchInput,
      searchQuery,
      selectedCollections,
    ],
  );

  useEffect(() => {
    const storedState = readPersistedStoryFeedState();

    if (storedState) {
      setItems(storedState.items);
      setPage(storedState.page);
      setHasNext(storedState.hasNext);
      setSelectedCollections(storedState.selectedCollections);
      setSearchQuery(storedState.searchQuery);
      setSearchInput(storedState.searchInput);
      setActiveImageByStory(storedState.activeImageByStory);
      if (typeof storedState.scrollY === "number") {
        setPendingScrollRestore(storedState.scrollY);
      }
    }

    setHasHydratedState(true);
  }, []);

  const syncStoryReadState = useCallback(() => {
    setStoryReadState(readStoryReadState());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    syncStoryReadState();

    const handleStoryReadStateChange = () => {
      syncStoryReadState();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== STORY_READ_STATE_STORAGE_KEY) {
        return;
      }

      syncStoryReadState();
    };

    window.addEventListener(
      STORY_READ_STATE_CHANGE_EVENT,
      handleStoryReadStateChange as EventListener,
    );
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        STORY_READ_STATE_CHANGE_EVENT,
        handleStoryReadStateChange as EventListener,
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, [syncStoryReadState]);

  const getFetchOptions = useCallback(() => {
    const allSelected = selectedCollections.length === Object.keys(SOURCE_MAP).length;
    const options: {
      collections?: string[];
      search?: string;
    } = allSelected ? {} : { collections: selectedCollections };
    if (searchQuery.trim()) {
      options.search = searchQuery.trim();
    }
    return options;
  }, [selectedCollections, searchQuery]);

  const loadMore = async () => {
    if (isLoading || !hasNext || selectedCollections.length === 0) {
      return;
    }

    setIsLoading(true);
    setLoadError("");

    try {
      const nextPage = page + 1;
      const response = await fetchStories(nextPage, getFetchOptions());

      setItems((prev) => {
        const seen = new Set(prev.map((story) => story.id));
        const incoming = response.items.filter((story) => !seen.has(story.id));
        return [...prev, ...incoming];
      });
      setPage(response.pagination.page);
      setHasNext(response.pagination.has_next);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to load more",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const refreshLatest = async () => {
    if (isRefreshing || isLoading) {
      return;
    }

    if (selectedCollections.length === 0) {
      setItems([]);
      setHasNext(false);
      setLoadError("");
      setActiveImageByStory({});
      return;
    }

    setIsRefreshing(true);
    setLoadError("");

    try {
      const response = await fetchStories(1, { ...getFetchOptions(), cache: "no-store" });
      setItems(response.items);
      setPage(response.pagination.page);
      setHasNext(response.pagination.has_next);
      setActiveImageByStory({});
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to refresh stories",
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const filterKey = JSON.stringify({
    selectedCollections,
    searchQuery: searchQuery.trim(),
  });

  useEffect(() => {
    if (!hasHydratedState) {
      return;
    }

    if (previousFilterKeyRef.current === null) {
      previousFilterKeyRef.current = filterKey;
      return;
    }

    if (previousFilterKeyRef.current === filterKey) {
      return;
    }

    previousFilterKeyRef.current = filterKey;

    let isActive = true;

    const fetchFiltered = async () => {
      if (selectedCollections.length === 0) {
        setItems([]);
        setHasNext(false);
        setLoadError("");
        setActiveImageByStory({});
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError("");

      try {
        const response = await fetchStories(1, getFetchOptions());
        if (!isActive) return;
        
        setItems(response.items);
        setPage(response.pagination.page);
        setHasNext(response.pagination.has_next);
        setActiveImageByStory({});
      } catch (error) {
        if (!isActive) return;
        
        setLoadError(
          error instanceof Error ? error.message : "Failed to filter stories",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchFiltered();

    return () => {
      isActive = false;
    };
  }, [filterKey, getFetchOptions, hasHydratedState, selectedCollections.length]);

  useEffect(() => {
    if (pendingScrollRestore === null || typeof window === "undefined") {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      window.scrollTo({ top: pendingScrollRestore, behavior: "auto" });
      setPendingScrollRestore(null);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [items.length, pendingScrollRestore]);

  useEffect(() => {
    if (!hasHydratedState) {
      return;
    }

    savePersistedStoryFeedState(buildPersistedState(window.scrollY));
  }, [buildPersistedState, hasHydratedState]);

  const handleCardNavigate = (storyId: string) => {
    if (typeof window !== "undefined") {
      savePersistedStoryFeedState(buildPersistedState(window.scrollY));
    }
    router.push(`/story/${storyId}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const hasUnreadUpdate = (story: StoryItem) =>
    story.has_follow_up &&
    storyReadState[story.id]?.seenLatestTimelineEventAt !==
      story.latest_timeline_event_at;

  return (
    <section aria-label="Story feed">
      {/* Feed header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p
            className="story-card-label"
            style={{ marginBottom: 0, fontSize: "0.92rem" }}
          >
            ◆ Latest Stories
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <form onSubmit={handleSearch} className="flex-1 sm:flex-none relative group flex items-center">
            <svg 
              className="absolute left-3 text-[var(--muted)] group-focus-within:text-[var(--primary)] transition-colors" 
              viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="SEARCH"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full sm:w-64 border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)] pl-9 pr-8 py-[0.45rem] rounded-[2px] outline-none transition-colors placeholder:text-[var(--muted)] placeholder:opacity-70 focus:border-[var(--primary-border)] focus:bg-[var(--primary-glow)]"
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: "0.72rem",
                letterSpacing: "0.1em",
              }}
            />
            {searchInput && (
              <button 
                type="button" 
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                }}
                className="absolute right-2.5 text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                aria-label="Clear search"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </form>
          <SourceDropdown
            selectedCollections={selectedCollections}
            onChange={setSelectedCollections}
          />
          <button
            type="button"
            onClick={refreshLatest}
            disabled={isRefreshing || isLoading}
            className="btn-ghost"
          >
            <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{
              width: "0.85rem",
              height: "0.85rem",
            }}
            className={isRefreshing ? "animate-spin" : ""}
          >
            <path
              d="M20 12a8 8 0 1 1-2.34-5.66"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M20 4v6h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {isRefreshing ? "Refreshing" : "Refresh"}
        </button>
        </div>
      </div>

      {items.length === 0 && !isLoading ? (
        <div className="empty-state">
          {selectedCollections.length === 0 ? (
            <span className="text-gray-500">
              No stories available. Please select at least one source.
            </span>
          ) : searchQuery ? (
            <span className="text-gray-500">
              No stories found matching &quot;{searchQuery}&quot;. Try different keywords.
            </span>
          ) : (
            "No stories available."
          )}
        </div>
      ) : null}

      {items.length === 0 && isLoading ? (
        <div className="empty-state animate-pulse text-gray-500">
          Loading stories...
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        {items.map((story, index) => (
          <article
            key={story.id}
            role="link"
            tabIndex={0}
            aria-label={`Open story: ${story.headline}`}
            onClick={(event) => {
              const target = event.target as HTMLElement;
              if (target.closest("button,a")) {
                return;
              }
              handleCardNavigate(story.id);
            }}
            onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
              const target = event.target as HTMLElement;
              if (target.closest("button,a")) {
                return;
              }

              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleCardNavigate(story.id);
              }
            }}
            className="story-card card-enter flex h-full cursor-pointer flex-col focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
            style={{ animationDelay: `${(index % 10) * 65}ms` }}
          >
            <StoryImageCarousel
              images={story.cover_images}
              activeIndex={activeImageByStory[story.id] ?? 0}
              onChange={(nextIndex) => setActiveImage(story.id, nextIndex)}
              heightClassName="h-52"
              prevButtonClassName="absolute top-1/2 left-3 -translate-y-1/2 cursor-pointer rounded-sm bg-black/60 px-2.5 py-1.5 text-xs text-white/85 transition-colors duration-200 hover:bg-black/80"
              nextButtonClassName="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-sm bg-black/60 px-2.5 py-1.5 text-xs text-white/85 transition-colors duration-200 hover:bg-black/80"
              dotsWrapperClassName="absolute right-3 bottom-3 flex gap-1.5 rounded-sm bg-black/50 px-2 py-1"
            />

            <div className="flex flex-1 flex-col p-5">
              {hasUnreadUpdate(story) ? (
                <p className="story-card-status-badge">New Update</p>
              ) : null}
              <h3 className="story-card-headline">{story.headline}</h3>
              <p className="story-card-meta mt-auto pt-2">
                {formatDate(story.latest_timeline_event_at)}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        {hasNext ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? "Loading..." : "Load More Stories"}
          </button>
        ) : items.length > 0 ? (
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.8rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            — End of stories —
          </p>
        ) : null}

        {loadError ? (
          <p
            role="status"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.78rem",
              color: "var(--error)",
            }}
          >
            {loadError}
          </p>
        ) : null}
      </div>
    </section>
  );
}
