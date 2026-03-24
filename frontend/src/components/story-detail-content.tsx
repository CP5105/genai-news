"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { formatDate, type StoryDetail } from "@/lib/news-api";
import StoryImageCarousel from "@/components/story-image-carousel";

type StoryDetailContentProps = {
  story: StoryDetail;
};

function formatTimelineType(value: string): string {
  if (!value) {
    return "Update";
  }

  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function StoryDetailContent({ story }: StoryDetailContentProps) {
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const timelineEvents = story.timeline.filter(
    (event) => event.summary.length > 0,
  );

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
          <p className="detail-section-label">◆ Story Brief</p>

          <h1 className="detail-headline">{story.headline}</h1>

          <p className="detail-meta">
            Latest reference — {formatDate(story.latest_ref_article_at)}
          </p>

          {timelineEvents.length > 0 ? (
            <section className="detail-timeline" aria-label="Story timeline">
              <div className="detail-timeline-header">
                <h2>Timeline</h2>
                <span className="detail-timeline-count">
                  {timelineEvents.length}{" "}
                  {timelineEvents.length === 1 ? "update" : "updates"}
                </span>
              </div>

              <div className="detail-timeline-list">
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
