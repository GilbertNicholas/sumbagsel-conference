'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface PhotoCarouselProps {
  photos: string[];
  interval?: number;
}

export function PhotoCarousel({ photos, interval = 3000 }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
    }, interval);

    return () => clearInterval(timer);
  }, [photos.length, interval]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Blur overlay kiri - gradient blur effect untuk soft edge */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black/30 via-black/15 to-transparent backdrop-blur-md z-10 pointer-events-none" />
      
      {/* Foto utama */}
      <div className="relative w-full h-full">
        {photos.map((photo, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-20' : 'opacity-0 z-10'
            }`}
          >
            <Image
              src={photo}
              alt={`Conference photo ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
              sizes="100vw"
            />
          </div>
        ))}
      </div>

      {/* Blur overlay kanan - gradient blur effect untuk soft edge */}
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black/30 via-black/15 to-transparent backdrop-blur-md z-10 pointer-events-none" />
    </div>
  );
}

