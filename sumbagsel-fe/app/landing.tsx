'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PhotoCarousel } from '@/components/photo-carousel';

// Foto carousel dari public/images/landing
const conferencePhotos = [
  '/images/landing/1.JPG',
  '/images/landing/2.JPG',
  '/images/landing/3.JPG',
  '/images/landing/4.JPG',
  '/images/landing/5.JPG',
  '/images/landing/6.JPG',
  '/images/landing/7.JPG',
  '/images/landing/8.JPG',
  '/images/landing/9.JPG',
  '/images/landing/10.JPG',
];

export function LandingPage() {
  // Landing page should just display content
  // AuthGuard will handle redirects if needed
  // User can click login button to go to login page


  return (
    <div className="min-h-screen bg-white relative">
      {/* Photo Carousel - Full Width dari ujung ke ujung */}
      <div className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[1000px] overflow-hidden">
        <PhotoCarousel photos={conferencePhotos} interval={3000} />
      </div>
      
      {/* Logo SumBagSel - 50% di atas carousel, 50% overlay dengan content section */}
      {/* Posisi logo: top-[400px] sm:top-[500px] md:top-[600px] lg:top-[1000px] */}
      <div className="absolute top-[400px] sm:top-[500px] md:top-[600px] lg:top-[1000px] left-1/2 -translate-x-1/2 -translate-y-4/7 z-30 flex justify-center pointer-events-none">
        <Image
          src="/images/sumbagsel-logo.png"
          alt="SumBagSel Conference Logo"
          width={1800}
          height={120}
          className="h-auto w-auto max-w-[370px] sm:max-w-[300px] md:max-w-[500px] lg:max-w-[800px] xl:max-w-[1500px] drop-shadow-2xl pointer-events-none"
          priority
        />
      </div>
      
      {/* Content Section - Responsive container */}
      <div className="relative z-20 mx-auto w-full max-w-[420px] px-5 pt-[calc(30px+30px)] sm:pt-[calc(100px+40px)] md:pt-[calc(600px+50px)] lg:pt-[calc(180px+60px)] pb-8 sm:max-w-2xl md:max-w-4xl lg:max-w-6xl">

        {/* Region List */}
        <div className="mt-0 mb-8 sm:mb-10 md:mb-12 lg:mb-8 text-center">
          <p className="text-[#0F0F0F] font-semibold text-xs sm:text-sm md:text-xl tracking-[0.2px]">
            Batam . Palembang . Jambi . Pekanbaru . Bangka
          </p>
        </div>

        {/* Tombol Login - Responsive width */}
        <div className="mx-auto flex max-w-md flex-col gap-4 sm:max-w-lg md:max-w-xl">
          <Link
            href="/auth/login"
            className="flex items-center justify-center rounded-[18px] bg-[#C84343] px-8 py-4 text-sm sm:text-lg font-bold leading-[1.2] text-white transition-colors hover:bg-[#A73535] cursor-pointer"
          >
            Login dengan WhatsApp
          </Link>
        </div>
      </div>
    </div>
  );
}

