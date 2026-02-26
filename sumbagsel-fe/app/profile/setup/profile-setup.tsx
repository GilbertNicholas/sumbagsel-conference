'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';

const CHURCH_OPTIONS = [
  'GKDI Batam',
  'GKDI Bangka',
  'GKDI Jambi',
  'GKDI Palembang',
  'GKDI Pekanbaru',
] as const;

const MINISTRY_OPTIONS = ['Teens/Campus', 'Single/S2', 'Married'] as const;

const profileSetupSchema = z.object({
  fullName: z.string().min(1, 'Nama lengkap harus diisi').max(150, 'Nama lengkap maksimal 150 karakter'),
  churchName: z.string().min(1, 'Pilih nama gereja'),
  ministry: z.enum(MINISTRY_OPTIONS, { required_error: 'Pilih pelayanan' }),
  customChurchName: z.string().optional(),
  contactEmail: z.string().email('Email tidak valid').optional().or(z.literal('')),
  photoUrl: z.string().url('URL tidak valid').optional().or(z.literal('')),
}).refine((data) => {
  if (data.churchName === 'Lainnya') {
    return data.customChurchName && data.customChurchName.trim().length > 0;
  }
  return true;
}, {
  message: 'Masukkan nama gereja',
  path: ['customChurchName'],
});

type ProfileSetupFormData = z.infer<typeof profileSetupSchema>;

export function ProfileSetupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProfileSetupFormData>({
    resolver: zodResolver(profileSetupSchema),
  });

  const churchName = watch('churchName');
  const isOtherSelected = churchName === 'Lainnya';

  useEffect(() => {
    async function checkProfile() {
      try {
        const profile = await apiClient.getMyProfile();
        // Check if profile has valid data (not placeholder)
        const hasValidFullName = profile.fullName && 
          profile.fullName.trim() !== '' && 
          profile.fullName !== 'Belum diisi';
        const hasValidChurchName = profile.churchName && 
          profile.churchName.trim() !== '' && 
          profile.churchName !== 'Belum diisi';
        const hasValidMinistry = profile.ministry && profile.ministry.trim() !== '';
        const isProfileValid = hasValidFullName && hasValidChurchName && hasValidMinistry;
        
        if (isProfileValid) {
          router.push('/dashboard');
        }
      } catch (error) {
        // Profile doesn't exist yet, that's fine
      } finally {
        setIsChecking(false);
      }
    }
    checkProfile();
  }, [router]);

  const onSubmit = async (data: ProfileSetupFormData) => {
    try {
      setError(null);
      setIsLoading(true);

      const profileData = {
        fullName: data.fullName,
        churchName: data.churchName === 'Lainnya' ? (data.customChurchName || '') : data.churchName,
        ministry: data.ministry,
        contactEmail: data.contactEmail || undefined,
        photoUrl: data.photoUrl || undefined,
      };

      try {
        // Try to update existing profile first
        await apiClient.updateProfile(profileData);
      } catch (updateError) {
        // If update fails, create new profile
        await apiClient.createProfile(profileData);
      }

      // Backend automatically sets isCompleted to true when fullName and churchName are valid
      // Use window.location for hard redirect to ensure fresh data is loaded
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan profil');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 lg:h-12 lg:w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-sm lg:text-base xl:text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      {/* Container untuk Logo */}
      <div className="w-full max-w-md lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mb-8 lg:mb-12">
        <div className="flex justify-center mt-6 lg:mt-8 mb-4 lg:mb-6">
          <Image
            src="/images/sumbagsel-welcome.png"
            alt="Selamat Datang SumBagSel"
            width={1800}
            height={1200}
            className="h-auto w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[700px] xl:max-w-[900px] 2xl:max-w-[1100px]"
            priority
          />
        </div>
        <p className="mt-2 lg:mt-3 text-center text-md lg:text-base xl:text-lg text-gray-600">
          Lengkapi informasi profil Anda
        </p>
      </div>

      {/* Container untuk Form */}
      <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl">
        <form className="space-y-6 lg:space-y-8" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 lg:p-5">
              <p className="text-sm lg:text-base text-red-800">{error}</p>
            </div>
          )}
          <div className="space-y-5 lg:space-y-6">
            <div>
              <label htmlFor="fullName" className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                Nama Lengkap *
              </label>
              <input
                {...register('fullName')}
                type="text"
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all text-sm lg:text-base xl:text-lg"
                placeholder="Masukkan nama lengkap Anda"
              />
              {errors.fullName && (
                <p className="mt-2 text-sm lg:text-base text-red-600">
                  {errors.fullName.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="churchName" className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                Nama Gereja *
              </label>
              <div className="relative">
                <select
                  {...register('churchName')}
                  defaultValue=""
                  className={`block w-full rounded-lg border border-gray-300 px-4 py-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 pr-10 lg:pr-12 xl:pr-14 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all text-base lg:text-base xl:text-lg appearance-none cursor-pointer bg-white ${
                    !churchName ? 'text-gray-400' : 'text-gray-900'
                  }`}
                  style={{
                    fontSize: '16px', // Prevent zoom on iOS
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                  }}
                >
                  <option value="" disabled style={{ fontSize: '16px', padding: '12px' }}>Pilih asal gereja</option>
                  {CHURCH_OPTIONS.map((church) => (
                    <option key={church} value={church} style={{ fontSize: '16px', padding: '12px' }}>
                      {church}
                    </option>
                  ))}
                  <option value="Lainnya" style={{ fontSize: '16px', padding: '12px' }}>Lainnya</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 lg:pr-4 xl:pr-5 pointer-events-none">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.churchName && (
                <p className="mt-2 text-sm lg:text-base text-red-600">
                  {errors.churchName.message}
                </p>
              )}
              {isOtherSelected && (
                <div className="mt-3 lg:mt-4">
                  <input
                    {...register('customChurchName')}
                    type="text"
                    className="block w-full rounded-lg border border-gray-300 px-4 py-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all text-sm lg:text-base xl:text-lg"
                    placeholder="Contoh: GKDI Balige"
                  />
                  {errors.customChurchName && (
                    <p className="mt-2 text-sm lg:text-base text-red-600">
                      {errors.customChurchName.message}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="ministry" className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                Ministry *
              </label>
              <div className="relative">
                <select
                  {...register('ministry')}
                  defaultValue=""
                  className={`block w-full rounded-lg border border-gray-300 px-4 py-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 pr-10 lg:pr-12 xl:pr-14 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all text-base lg:text-base xl:text-lg appearance-none cursor-pointer bg-white ${
                    !watch('ministry') ? 'text-gray-400' : 'text-gray-900'
                  }`}
                  style={{
                    fontSize: '16px',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                  }}
                >
                  <option value="" disabled style={{ fontSize: '16px', padding: '12px' }}>Pilih pelayanan</option>
                  {MINISTRY_OPTIONS.map((m) => (
                    <option key={m} value={m} style={{ fontSize: '16px', padding: '12px' }}>
                      {m}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 lg:pr-4 xl:pr-5 pointer-events-none">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.ministry && (
                <p className="mt-2 text-sm lg:text-base text-red-600">
                  {errors.ministry.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="contactEmail" className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                Email Kontak
              </label>
              <input
                {...register('contactEmail')}
                type="email"
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all text-sm lg:text-base xl:text-lg"
                placeholder="contoh@email.com (opsional)"
              />
              {errors.contactEmail && (
                <p className="mt-2 text-sm lg:text-base text-red-600">
                  {errors.contactEmail.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="photoUrl" className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                URL Foto
              </label>
              <input
                {...register('photoUrl')}
                type="url"
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all text-sm lg:text-base xl:text-lg"
                placeholder="https://example.com/foto.jpg (opsional)"
              />
              {errors.photoUrl && (
                <p className="mt-2 text-sm lg:text-base text-red-600">
                  {errors.photoUrl.message}
                </p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 lg:px-8 lg:py-4 xl:px-10 xl:py-5 text-sm lg:text-base xl:text-lg font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

