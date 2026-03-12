'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import { capitalizeWords } from '@/lib/utils';

const CHURCH_OPTIONS = [
  'GKDI Batam',
  'GKDI Bangka',
  'GKDI Jambi',
  'GKDI Palembang',
  'GKDI Pekanbaru',
] as const;

const MINISTRY_OPTIONS = ['Teens/Campus', 'Single/S2', 'Married'] as const;
const GENDER_OPTIONS = ['Pria', 'Wanita'] as const;

const profileSetupSchema = z
  .object({
    fullName: z.string().min(1, 'Nama lengkap harus diisi').max(150, 'Nama lengkap maksimal 150 karakter'),
    churchName: z.string().min(1, 'Pilih nama gereja'),
    ministry: z.string().refine((val) => val !== '' && MINISTRY_OPTIONS.includes(val as (typeof MINISTRY_OPTIONS)[number]), { message: 'Pilih Ministry' }),
    gender: z.string().refine((val) => val !== '' && GENDER_OPTIONS.includes(val as (typeof GENDER_OPTIONS)[number]), { message: 'Pilih Gender' }),
    age: z.union([z.string(), z.number()]).refine((val) => {
      if (val === '' || val === undefined || val === null) return false;
      const n = typeof val === 'string' ? parseInt(val, 10) : val;
      return !isNaN(n) && n >= 13 && n <= 100;
    }, { message: 'Usia wajib diisi, minimal 13 dan maksimal 100 tahun' }),
    customChurchName: z.string().optional(),
    phoneNumber: z
      .string()
      .min(1, 'Nomor WhatsApp wajib diisi')
      .refine((val) => /^(\+62|0)[0-9]{9,12}$/.test(val.trim()), 'Nomor WhatsApp harus 08xx atau +628xx'),
    contactEmail: z
      .string()
      .min(1, 'Email wajib diisi')
      .email('Email tidak valid'),
  })
  .refine((data) => data.churchName !== 'Lainnya' || (data.customChurchName && data.customChurchName.trim().length > 0), {
    message: 'Masukkan nama gereja',
    path: ['customChurchName'],
  });

type ProfileSetupFormData = z.infer<typeof profileSetupSchema>;

export function ProfileSetupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [loginCredential, setLoginCredential] = useState<'email' | 'phone' | null>(null);

  const emailLocked = loginCredential === 'email';
  const phoneLocked = loginCredential === 'phone';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } =   useForm<ProfileSetupFormData>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: { ministry: '', gender: '', age: '' },
  });

  const churchName = watch('churchName');
  const isOtherSelected = churchName === 'Lainnya';

  useEffect(() => {
    async function checkProfile() {
      try {
        const profileData = await apiClient.getMyProfile();

        const hasValidFullName = profileData.fullName && profileData.fullName.trim() !== '' && profileData.fullName !== 'Belum diisi';
        const hasValidChurchName = profileData.churchName && profileData.churchName.trim() !== '' && profileData.churchName !== 'Belum diisi';
        const hasValidMinistry = profileData.ministry && profileData.ministry.trim() !== '';
        const hasValidGender = (profileData as { gender?: string }).gender && (profileData as { gender?: string }).gender!.trim() !== '';
        const hasValidAge = (profileData as { age?: number | null }).age != null && (profileData as { age?: number | null }).age! >= 13 && (profileData as { age?: number | null }).age! <= 100;
        const hasValidPhone = profileData.phoneNumber && profileData.phoneNumber.trim() !== '' && profileData.phoneNumber !== 'Belum diisi';
        const hasValidEmail = profileData.contactEmail && profileData.contactEmail.trim() !== '';
        const isProfileValid = hasValidFullName && hasValidChurchName && hasValidMinistry && hasValidGender && hasValidAge && hasValidPhone && hasValidEmail;

        // Tentukan credential login: email jika contactEmail ada & phone kosong, phone jika sebaliknya
        const hasEmail = !!profileData.contactEmail?.trim();
        const hasPhone = !!profileData.phoneNumber?.trim() && profileData.phoneNumber !== 'Belum diisi';
        if (hasEmail && !hasPhone) setLoginCredential('email');
        else if (hasPhone && !hasEmail) setLoginCredential('phone');

        if (isProfileValid) {
          router.push('/dashboard');
        } else {
          setValue('fullName', profileData.fullName && profileData.fullName !== 'Belum diisi' ? profileData.fullName : '');
          const isCustomChurch = profileData.churchName && profileData.churchName !== 'Belum diisi' && !CHURCH_OPTIONS.includes(profileData.churchName as (typeof CHURCH_OPTIONS)[number]);
          setValue('churchName', isCustomChurch ? 'Lainnya' : (profileData.churchName && profileData.churchName !== 'Belum diisi' ? profileData.churchName : ''));
          setValue('customChurchName', isCustomChurch ? profileData.churchName : '');
          const ministryVal = profileData.ministry;
          const ministry = ministryVal && MINISTRY_OPTIONS.includes(ministryVal as (typeof MINISTRY_OPTIONS)[number])
            ? (ministryVal as (typeof MINISTRY_OPTIONS)[number])
            : '';
          setValue('ministry', ministry);
          const profileGender = (profileData as { gender?: string }).gender;
          setValue('gender', profileGender && GENDER_OPTIONS.includes(profileGender as (typeof GENDER_OPTIONS)[number]) ? profileGender as (typeof GENDER_OPTIONS)[number] : '');
          const profileAge = (profileData as { age?: number | null }).age;
          setValue('age', profileAge != null && profileAge >= 13 && profileAge <= 100 ? String(profileAge) : '');
          const hasValidPhoneVal = profileData.phoneNumber && profileData.phoneNumber.trim() !== '' && profileData.phoneNumber !== 'Belum diisi';
          const hasValidEmailVal = profileData.contactEmail && profileData.contactEmail.trim() !== '';
          setValue('contactEmail', hasValidEmailVal ? profileData.contactEmail! : '');
          setValue('phoneNumber', hasValidPhoneVal ? profileData.phoneNumber! : '');
        }
      } catch (err) {
        // Profile doesn't exist yet
      } finally {
        setIsChecking(false);
      }
    }
    checkProfile();
  }, [router, setValue]);

  const onSubmit = async (data: ProfileSetupFormData) => {
    try {
      setError(null);
      setIsLoading(true);

      const ageVal = data.age;
      const ageNum = ageVal === '' || ageVal === undefined || ageVal === null
        ? undefined
        : (typeof ageVal === 'string' ? parseInt(ageVal, 10) : ageVal);
      const profileData = {
        fullName: capitalizeWords(data.fullName.trim()),
        churchName: data.churchName === 'Lainnya' ? (data.customChurchName || '') : data.churchName,
        ministry: data.ministry,
        gender: data.gender,
        age: ageNum != null && !isNaN(ageNum) && ageNum >= 13 && ageNum <= 100 ? ageNum : undefined,
        contactEmail: data.contactEmail?.trim() || undefined,
        phoneNumber: data.phoneNumber?.trim() || undefined,
      };

      try {
        await apiClient.updateProfile(profileData);
      } catch (updateError) {
        // Jangan fallback ke create jika error credential (No. WA/Email sudah terdaftar)
        const msg = updateError instanceof Error ? updateError.message : String(updateError);
        if (msg.includes('sudah terdaftar')) {
          throw updateError;
        }
        if (profileData.age == null) {
          throw new Error('Usia wajib diisi');
        }
        await apiClient.createProfile({ ...profileData, age: profileData.age });
      }

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
    <div className="h-[100dvh] min-h-[100svh] overflow-hidden flex flex-col bg-gray-50">
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        {/* Container untuk Logo */}
        <div className="w-full max-w-md lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mb-6 sm:mb-8 lg:mb-12">
          <div className="flex justify-center mt-4 sm:mt-6 lg:mt-8 mb-3 sm:mb-4 lg:mb-6">
            <Image
              src="/images/sumbagsel-logo.png"
              alt="Sumbagsel Conference"
              width={1800}
              height={1200}
              className="h-auto w-full max-w-[240px] sm:max-w-[300px] md:max-w-[500px] lg:max-w-[700px] xl:max-w-[900px] 2xl:max-w-[1100px]"
              priority
            />
          </div>
          <p className="mt-1.5 sm:mt-2 lg:mt-3 text-center text-sm lg:text-base xl:text-lg text-gray-600">
            Lengkapi informasi profil Anda
          </p>
        </div>

      {/* Container untuk Form */}
      <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl">
        <form className="space-y-6 lg:space-y-8" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-lg bg-red-50 border-2 border-red-300 p-4 lg:p-5">
              <p className="text-base lg:text-lg font-semibold text-red-800">{error}</p>
              {(error === 'No. WA sudah terdaftar!' || error === 'Email sudah terdaftar!') && (
                <p className="mt-2 text-sm lg:text-base text-red-700">
                  Silakan gunakan nomor atau email lain.
                </p>
              )}
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
                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all text-sm lg:text-base xl:text-lg"
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
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all text-sm lg:text-base xl:text-lg"
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
                  <option value="" disabled style={{ fontSize: '16px', padding: '12px' }}>Pilih Ministry</option>
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
              <label htmlFor="gender" className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                Gender *
              </label>
              <div className="relative">
                <select
                  {...register('gender')}
                  defaultValue=""
                  className={`block w-full rounded-lg border border-gray-300 px-4 py-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 pr-10 lg:pr-12 xl:pr-14 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all text-base lg:text-base xl:text-lg appearance-none cursor-pointer bg-white ${
                    !watch('gender') ? 'text-gray-400' : 'text-gray-900'
                  }`}
                  style={{ fontSize: '16px', WebkitAppearance: 'none', MozAppearance: 'none' }}
                >
                  <option value="" disabled>Pilih Gender</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 lg:pr-4 xl:pr-5 pointer-events-none">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.gender && (
                <p className="mt-2 text-sm lg:text-base text-red-600">{errors.gender.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="age" className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                Usia (tahun) *
              </label>
              <input
                {...register('age')}
                type="number"
                min={13}
                max={100}
                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all text-sm lg:text-base xl:text-lg"
                placeholder="Contoh: 25"
              />
              {errors.age && (
                <p className="mt-2 text-sm lg:text-base text-red-600">{errors.age.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                Nomor WhatsApp *
              </label>
              <p className="mb-1 text-xs lg:text-sm text-gray-500">Gunakan no. WA yang aktif</p>
              <input
                {...register('phoneNumber')}
                type="tel"
                disabled={phoneLocked}
                className={`block w-full rounded-lg border border-gray-300 px-4 py-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all text-sm lg:text-base xl:text-lg ${
                  phoneLocked ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                }`}
                placeholder={phoneLocked ? '' : '08xx atau +628xx'}
              />
              {phoneLocked && (
                <p className="mt-1 text-xs text-gray-500">Terdaftar via login, tidak dapat diubah</p>
              )}
              {errors.phoneNumber && (
                <p className="mt-2 text-sm lg:text-base text-red-600">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="contactEmail" className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                Email *
              </label>
              <p className="mb-1 text-xs lg:text-sm text-gray-500">Gunakan email yang aktif</p>
              <input
                {...register('contactEmail')}
                type="email"
                disabled={emailLocked}
                className={`block w-full rounded-lg border border-gray-300 px-4 py-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all text-sm lg:text-base xl:text-lg ${
                  emailLocked ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                }`}
                placeholder={emailLocked ? '' : 'contoh@email.com'}
              />
              {emailLocked && (
                <p className="mt-1 text-xs text-gray-500">Terdaftar via login, tidak dapat diubah</p>
              )}
              {errors.contactEmail && (
                <p className="mt-2 text-sm lg:text-base text-red-600">
                  {errors.contactEmail.message}
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
    </div>
  );
}

