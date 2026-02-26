'use client';

import Link from 'next/link';
import Image from 'next/image';
import { HeroCarousel } from '@/components/hero-carousel';

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
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-neutral-100">
      {/* Header - Logo: center di layar kecil, margin kiri di layar besar */}
      <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-center lg:justify-start px-4 sm:px-6 py-4 lg:pt-8 lg:pl-12 xl:pt-10 xl:pl-16 2xl:pt-12 2xl:pl-20">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/sumbagsel-logo.png"
            alt="Sumbagsel Conference"
            width={300}
            height={70}
            className="h-14 sm:h-16 lg:h-20 w-auto object-contain"
            priority
          />
        </Link>
      </header>

      {/* Hero Section - Full viewport dengan slideshow */}
      <section className="relative flex-1 min-h-[60vh] sm:min-h-[70vh] lg:min-h-screen">
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

        {/* White shade overlay - radial di tengah untuk layar kecil, gradient kiri untuk desktop */}
        <div
          className="absolute inset-0 z-10 lg:hidden bg-[radial-gradient(ellipse_140%_140%_at_50%_50%,rgba(255,255,255,0.75)_0%,rgba(255,255,255,0.3)_50%,transparent_70%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 z-10 hidden lg:block bg-gradient-to-r from-white/70 via-white/30 to-transparent"
          aria-hidden
        />

        {/* Content overlay - center di layar kecil, kiri di layar besar */}
        <div className="absolute inset-0 z-20 flex items-center justify-center lg:justify-start">
          <div className="w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl px-6 sm:px-12 md:px-16 lg:px-20 xl:px-24 py-20 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Logo Unshaken */}
            <div className="mb-4 lg:mb-5">
              <Image
                src="/images/theme-logo.png"
                alt="Unshaken"
                width={1000}
                height={240}
                className="h-auto w-full max-w-[480px] sm:max-w-[600px] md:max-w-[720px] lg:max-w-[860px] xl:max-w-[980px] drop-shadow-lg"
                priority
              />
            </div>

            {/* Deskripsi */}
            <p className="text-neutral-800 font-semibold text-base sm:text-lg md:text-xl lg:text-2xl xl:text-2xl leading-relaxed mb-5 lg:mb-6 max-w-2xl lg:max-w-3xl">
              Unshaken adalah tema dari konferensi region Sumatera Bagian Selatan GKDI yang mencakup: Batam, Palembang,
              Bangka, Jambi, Pekanbaru.
            </p>

            {/* Tombol Daftar dengan WhatsApp - hijau dengan icon WhatsApp */}
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-3 rounded-md bg-[#25D366] px-8 py-4 text-base lg:text-lg font-semibold text-white hover:bg-[#20BD5A] transition-colors"
            >
              <svg className="w-6 h-6 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Daftar dengan WhatsApp
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
