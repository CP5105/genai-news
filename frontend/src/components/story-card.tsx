"use client";

import { memo, type KeyboardEvent } from "react";
import { type StoryItem, formatDate } from "@/lib/news-api";
import StoryImageCarousel from "@/components/story-image-carousel";

type StoryCardProps = {
  story: StoryItem;
  index: number;
  activeImage: number;
  hasUnreadUpdate: boolean;
  onNavigate: (storyId: string) => void;
  onImageChange: (storyId: string, index: number) => void;
};

function StoryCard({
  story,
  index,
  activeImage,
  hasUnreadUpdate,
  onNavigate,
  onImageChange,
}: StoryCardProps) {
  const handleNavigate = () => {
    onNavigate(story.id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button,a")) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleNavigate();
    }
  };

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`Open story: ${story.headline}`}
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("button,a")) {
          return;
        }
        handleNavigate();
      }}
      onKeyDown={handleKeyDown}
      className="story-card card-enter flex h-full cursor-pointer flex-col focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
      style={{ animationDelay: `${(index % 10) * 65}ms` }}
    >
      <StoryImageCarousel
        images={story.cover_images}
        activeIndex={activeImage}
        onChange={(nextIndex) => onImageChange(story.id, nextIndex)}
        heightClassName="h-52"
        prevButtonClassName="absolute top-1/2 left-3 -translate-y-1/2 cursor-pointer rounded-sm bg-black/60 px-2.5 py-1.5 text-xs text-white/85 transition-colors duration-200 hover:bg-black/80"
        nextButtonClassName="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-sm bg-black/60 px-2.5 py-1.5 text-xs text-white/85 transition-colors duration-200 hover:bg-black/80"
        dotsWrapperClassName="absolute right-3 bottom-3 flex gap-1.5 rounded-sm bg-black/50 px-2 py-1"
        imageSizes="(min-width: 768px) 50vw, 94vw"
      />

      <div className="flex flex-1 flex-col p-5">
        <h3 className="story-card-headline">{story.headline}</h3>
        <div className="story-card-meta mt-auto pt-2">
          {hasUnreadUpdate ? (
            <>
              <span className="story-card-meta-status">
                <span className="story-card-meta-dot" aria-hidden="true" />
                Updated
              </span>
              <span className="story-card-meta-separator" aria-hidden="true">
                ·
              </span>
            </>
          ) : null}
          <span>{formatDate(story.latest_timeline_event_at)}</span>
        </div>
      </div>
    </article>
  );
}

export default memo(StoryCard);
