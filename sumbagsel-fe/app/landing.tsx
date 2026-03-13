'use client';

import Link from 'next/link';
import Image from 'next/image';
import { HeroCarousel } from '@/components/hero-carousel';

const conferencePhotos = [
  '/images/landing/1.png',
  '/images/landing/2.JPG',
  '/images/landing/3.JPG',
  '/images/landing/4.png',
  '/images/landing/5.JPG',
  '/images/landing/6.JPG',
  '/images/landing/7.JPG',
  '/images/landing/8.JPG',
  '/images/landing/9.JPG',
  '/images/landing/10.png',
];

export function LandingPage() {
  return (
    <div className="h-[100dvh] min-h-[100svh] overflow-hidden flex flex-col bg-neutral-100">
      {/* Header - Logo: tengah di layar kecil, kanan di layar besar */}
      <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-center lg:justify-end px-4 sm:px-6 py-4 lg:pt-8 lg:pr-12 xl:pt-10 xl:pr-16 2xl:pt-12 2xl:pr-20">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/sumbagsel-logo.png"
            alt="Sumbagsel Conference"
            width={300}
            height={70}
            className="h-12 sm:h-14 lg:h-[7.5rem] w-auto object-contain"
            priority
          />
        </Link>
      </header>

      {/* Hero Section - Full viewport dengan slideshow */}
      <section className="relative flex-1 min-h-0 overflow-hidden">
        {/* Slideshow background - menyesuaikan layar pengguna */}
        <div className="absolute inset-0">
          <HeroCarousel
            photos={conferencePhotos}
            interval={4000}
            showArrows={false}
            showIndicators={true}
            indicatorVariant="light"
          />
        </div>

        {/* White shade overlay - radial di tengah untuk semua ukuran layar */}
        <div
          className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_140%_140%_at_50%_50%,rgba(255,255,255,0.75)_0%,rgba(255,255,255,0.3)_50%,transparent_70%)]"
          aria-hidden
        />

        {/* Content overlay - center untuk semua ukuran layar */}
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl px-4 sm:px-6 md:px-12 lg:px-20 xl:px-24 py-6 sm:py-12 lg:py-20 flex flex-col items-center text-center">
            {/* Logo Unshaken */}
            <div className="mb-3 sm:mb-4 lg:mb-5">
              <Image
                src="/images/theme-logo.png"
                alt="Unshaken"
                width={1000}
                height={240}
                className="h-auto w-full max-w-[280px] sm:max-w-[480px] md:max-w-[720px] lg:max-w-[860px] xl:max-w-[980px] drop-shadow-lg"
                priority
              />
            </div>

            {/* Deskripsi */}
            <p className="text-neutral-800 font-semibold text-xs sm:text-base md:text-lg lg:text-2xl xl:text-2xl leading-relaxed mb-3 sm:mb-4 lg:mb-6 max-w-2xl lg:max-w-3xl">
              Unshaken adalah tema dari konferensi region Sumatera Bagian Selatan GKDI yang mencakup: Batam, Palembang,
              Bangka, Jambi, Lampung.
            </p>

            {/* Tombol Masuk dengan WhatsApp atau Email */}
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-3 sm:px-8 sm:py-4 text-sm sm:text-base lg:text-lg font-semibold text-white hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl whitespace-nowrap"
            >
              Masuk menggunakan WhatsApp atau Email
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
