'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface HeroCarouselProps {
  photos: string[];
  interval?: number;
  showArrows?: boolean;
  showIndicators?: boolean;
  /** 'dark' = light indicators (untuk bg gelap), 'light' = dark indicators (untuk bg terang) */
  indicatorVariant?: 'dark' | 'light';
}

export function HeroCarousel({
  photos,
  interval = 4000,
  showArrows = true,
  showIndicators = true,
  indicatorVariant = 'dark',
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    const timer = setInterval(goToNext, interval);
    return () => clearInterval(timer);
  }, [goToNext, interval]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Slideshow images - object-cover untuk menyesuaikan layar */}
      <div className="relative w-full h-full">
        {photos.map((photo, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <Image
              src={photo}
              alt={`Slide ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
              sizes="100vw"
            />
          </div>
        ))}
      </div>

      {/* Left arrow */}
      {showArrows && photos.length > 1 && (
        <button
          type="button"
          onClick={goToPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
          aria-label="Slide sebelumnya"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Right arrow */}
      {showArrows && photos.length > 1 && (
        <button
          type="button"
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
          aria-label="Slide berikutnya"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Slide indicators */}
      {showIndicators && photos.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {photos.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex
                  ? 'bg-[#C84343] w-6'
                  : indicatorVariant === 'light'
                    ? 'bg-neutral-600/70 hover:bg-neutral-600'
                    : 'bg-white/70 hover:bg-white'
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
