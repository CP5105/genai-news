"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { formatDate, type StoryDetail } from "@/lib/news-api";
import {
  getStoryReadStateEntry,
  setStoryReadStateEntry,
  type StoryReadStateEntry,
} from "@/lib/story-read-state";
import StoryImageCarousel from "@/components/story-image-carousel";

type StoryDetailContentProps = {
  story: StoryDetail;
};

type ReadStatusNotice = {
  storyId: string;
  previousEntry: StoryReadStateEntry | null;
};

function formatTimelineType(value: string): string {
  if (!value) {
    return "Update";
  }

  if (value === "initial") {
    return "Initial Report";
  }

  if (value === "update") {
    return "Follow-up";
  }

  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function StoryDetailContent({ story }: StoryDetailContentProps) {
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const [readStatusNotice, setReadStatusNotice] =
    useState<ReadStatusNotice | null>(null);
  const timelineSectionRef = useRef<HTMLElement | null>(null);
  const hasAutoMarkedRef = useRef(false);
  const autoMarkDisabledRef = useRef(false);
  const timelineEvents = story.timeline.filter(
    (event) => event.summary.length > 0,
  );
  const hasFollowUp = story.timeline.length > 1;
  const hasTimelineRail = timelineEvents.length > 1;
  const activeReadStatusNotice =
    readStatusNotice?.storyId === story.id ? readStatusNotice : null;

  useEffect(() => {
    hasAutoMarkedRef.current = false;
    autoMarkDisabledRef.current = false;

    if (
      typeof window === "undefined" ||
      !hasFollowUp ||
      !story.latest_timeline_event_at
    ) {
      return;
    }

    const existingEntry = getStoryReadStateEntry(story.id);
    if (
      existingEntry?.seenLatestTimelineEventAt === story.latest_timeline_event_at
    ) {
      return;
    }

    let visibleElapsedMs = 0;
    let hasEngaged = window.scrollY > 120;
    let hasSeenTimeline = false;

    const checkTimelineVisibility = () => {
      const section = timelineSectionRef.current;
      if (!section) {
        return;
      }

      const rect = section.getBoundingClientRect();
      if (
        rect.top < window.innerHeight * 0.85 &&
        rect.bottom > window.innerHeight * 0.15
      ) {
        hasSeenTimeline = true;
      }
    };

    const maybeMarkUpToDate = () => {
      if (hasAutoMarkedRef.current || autoMarkDisabledRef.current) {
        return;
      }

      if (document.visibilityState !== "visible") {
        return;
      }

      if (visibleElapsedMs < 5000) {
        return;
      }

      if (!hasEngaged && !hasSeenTimeline) {
        return;
      }

      hasAutoMarkedRef.current = true;

      const previousEntry = getStoryReadStateEntry(story.id);
      setStoryReadStateEntry(story.id, {
        seenLatestTimelineEventAt: story.latest_timeline_event_at,
      });
      setReadStatusNotice({
        storyId: story.id,
        previousEntry,
      });
    };

    const handleScroll = () => {
      if (window.scrollY > 120) {
        hasEngaged = true;
      }

      checkTimelineVisibility();
      maybeMarkUpToDate();
    };

    const handlePointerDown = () => {
      hasEngaged = true;
      maybeMarkUpToDate();
    };

    const handleKeyDown = () => {
      hasEngaged = true;
      maybeMarkUpToDate();
    };

    const handleVisibilityChange = () => {
      checkTimelineVisibility();
      maybeMarkUpToDate();
    };

    checkTimelineVisibility();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      visibleElapsedMs += 1000;
      checkTimelineVisibility();
      maybeMarkUpToDate();
    }, 1000);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hasFollowUp, story.id, story.latest_timeline_event_at]);

  const handleUndoReadStatus = () => {
    if (!activeReadStatusNotice) {
      return;
    }

    autoMarkDisabledRef.current = true;
    hasAutoMarkedRef.current = true;
    setStoryReadStateEntry(story.id, activeReadStatusNotice.previousEntry);
    setReadStatusNotice(null);
  };

  return (
    <main className="mx-auto w-[min(1100px,94vw)] py-8 md:py-12">
      <div className="mb-7">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-ghost"
        >
          <span aria-hidden="true">←</span>
          Back
        </button>
      </div>

      <article className="detail-article">
        <StoryImageCarousel
          images={story.cover_images}
          activeIndex={activeImage}
          onChange={setActiveImage}
          heightClassName="h-72 md:h-96"
          prevButtonClassName="absolute top-1/2 left-4 -translate-y-1/2 cursor-pointer rounded-sm bg-black/60 px-3 py-2 text-sm text-white/85 transition-colors duration-200 hover:bg-black/80"
          nextButtonClassName="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer rounded-sm bg-black/60 px-3 py-2 text-sm text-white/85 transition-colors duration-200 hover:bg-black/80"
          dotsWrapperClassName="absolute right-4 bottom-4 flex gap-1.5 rounded-sm bg-black/50 px-2 py-1"
        />

        <div className="p-6 md:p-9 lg:p-11">
          {activeReadStatusNotice ? (
            <div
              className="detail-status-note mb-5"
              role="status"
              aria-live="polite"
            >
              <p className="detail-status-copy">Up to date</p>
              <button
                type="button"
                onClick={handleUndoReadStatus}
                className="detail-status-action"
              >
                Undo
              </button>
            </div>
          ) : null}

          <p className="detail-section-label">◆ Overview</p>

          <h1 className="detail-headline">{story.headline}</h1>

          {timelineEvents.length > 0 ? (
            <section
              ref={timelineSectionRef}
              className="detail-timeline"
              aria-label="Story timeline"
            >
              <h2 className="sr-only">Timeline</h2>

              <div
                className={`detail-timeline-list${hasTimelineRail ? " detail-timeline-list--connected" : ""}`}
              >
                {timelineEvents.map((event, index) => (
                  <article
                    key={`${story.id}-timeline-${index}`}
                    className="detail-timeline-item"
                  >
                    <div className="detail-timeline-marker" aria-hidden="true" />

                    <div className="detail-timeline-card">
                      <div className="detail-timeline-meta">
                        <span className="detail-timeline-badge">
                          {formatTimelineType(event.type)}
                        </span>
                        <span>{formatDate(event.event_at)}</span>
                      </div>

                      <div className="detail-timeline-summary">
                        <ul className="detail-timeline-summary-list">
                          {event.summary.map((summaryItem, summaryIndex) => (
                            <li
                              key={`${story.id}-timeline-${index}-summary-${summaryIndex}`}
                              className="detail-timeline-summary-item"
                            >
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => <>{children}</>,
                                }}
                              >
                                {summaryItem}
                              </ReactMarkdown>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </article>

      <section className="mt-10">
        <div
          className="mb-5"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.35rem",
              fontWeight: 600,
              color: "var(--heading)",
              margin: 0,
              flexShrink: 0,
            }}
          >
            Source Articles
          </h2>
          <div className="sources-divider" />
          <span className="sources-count" style={{ flexShrink: 0 }}>
            {story.ref_articles.length}{" "}
            {story.ref_articles.length === 1 ? "source" : "sources"}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {story.ref_articles.map((ref, index) => {
            const title = ref.title.trim();
            const source = ref.source.trim();
            const publishedAt = ref.update_date.trim();
            const url = ref.url.trim();
            const itemKey = ref.article_id || url || `${story.id}-${index}`;

            return (
              <article key={itemKey} className="ref-card">
                <p className="ref-card-title">{title || `Reference ${index + 1}`}</p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.8rem",
                  }}
                >
                  {source ? (
                    <span className="ref-card-source">{source}</span>
                  ) : null}
                  {source && publishedAt ? (
                    <span
                      style={{
                        color: "var(--border-strong)",
                        fontSize: "0.7rem",
                      }}
                    >
                      /
                    </span>
                  ) : null}
                  {publishedAt ? (
                    <span className="ref-card-date">
                      {formatDate(publishedAt)}
                    </span>
                  ) : null}
                </div>

                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                    style={{ fontSize: "0.74rem", padding: "0.38rem 0.9rem" }}
                  >
                    Read source ↗
                  </a>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
