"use client";

import Image from "next/image";
import type { MouseEvent } from "react";

type StoryImageCarouselProps = {
  images: string[];
  activeIndex: number;
  onChange: (nextIndex: number) => void;
  heightClassName: string;
  prevButtonClassName: string;
  nextButtonClassName: string;
  dotsWrapperClassName: string;
  imageLoading?: "eager" | "lazy";
  imageSizes?: string;
};

export default function StoryImageCarousel({
  images,
  activeIndex,
  onChange,
  heightClassName,
  prevButtonClassName,
  nextButtonClassName,
  dotsWrapperClassName,
  imageLoading = "lazy",
  imageSizes = "100vw",
}: StoryImageCarouselProps) {
  const totalImages = images.length;
  const currentImage =
    totalImages > 0 ? images[Math.min(activeIndex, totalImages - 1)] : null;

  const runAction = (event: MouseEvent<HTMLButtonElement>, action: () => void) => {
    event.preventDefault();
    action();
  };

  return (
    <div className={`relative overflow-hidden ${heightClassName}`}>
      {currentImage ? (
        <Image
          src={currentImage}
          alt=""
          fill
          sizes={imageSizes}
          loading={imageLoading}
          priority={imageLoading === "eager"}
          className="object-cover object-center"
          aria-hidden="true"
        />
      ) : (
        <div className={`carousel-no-image h-full w-full`}>
          No cover image
        </div>
      )}

      {totalImages > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous cover image"
            onClick={(event) =>
              runAction(event, () =>
                onChange((activeIndex - 1 + totalImages) % totalImages),
              )
            }
            className={prevButtonClassName}
          >
            {"<"}
          </button>
          <button
            type="button"
            aria-label="Next cover image"
            onClick={(event) =>
              runAction(event, () => onChange((activeIndex + 1) % totalImages))
            }
            className={nextButtonClassName}
          >
            {">"}
          </button>
          <div className={dotsWrapperClassName}>
            {images.map((_, index) => (
              <button
                key={`dot-${index}`}
                type="button"
                aria-label={`Show image ${index + 1}`}
                onClick={(event) => runAction(event, () => onChange(index))}
                className={`h-1.5 w-1.5 cursor-pointer rounded-full transition-colors duration-200 ${
                  index === activeIndex ? "bg-white" : "bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
