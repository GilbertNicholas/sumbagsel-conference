'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getAuthToken } from '@/lib/auth';
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
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleGoogleLogin = () => {
    // Placeholder untuk Google login
    console.log('Google login - coming soon');
  };

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

        {/* Link Signup */}
        <div className="mb-6 sm:mb-8 text-center">
          <p className="text-md sm:text-lg text-[#4B5563]">
            Belum punya akun?{' '}
            <Link
              href="/auth/signup"
              className="font-semibold text-[#2563EB] underline hover:text-[#1d4ed8] cursor-pointer"
            >
              Buat disini
            </Link>
          </p>
        </div>

        {/* Tombol Login - Responsive width */}
        <div className="mx-auto flex max-w-md flex-col gap-4 sm:max-w-lg md:max-w-xl">
          <Link
            href="/auth/login"
            className="flex items-center justify-center rounded-[18px] bg-[#C84343] px-8 py-4 text-sm sm:text-lg font-bold leading-[1.2] text-white transition-colors hover:bg-[#A73535] cursor-pointer"
          >
            Login dengan Email
          </Link>
          
          <button
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-2 rounded-[18px] bg-[#C84343] px-8 py-4 text-sm sm:text-lg font-bold leading-[1.2] text-white transition-colors hover:bg-[#A73535] cursor-pointer"
          >
            <svg
              className="h-5 w-5 sm:h-6 sm:w-6"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Login dengan Google
          </button>
        </div>
      </div>
    </div>
  );
}

