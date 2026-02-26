'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient, ProfileResponse, RegistrationResponse } from '@/lib/api-client';
import { DashboardLayout } from '@/components/dashboard-layout';

const CHURCH_OPTIONS = [
  'GKDI Batam',
  'GKDI Bangka',
  'GKDI Jambi',
  'GKDI Palembang',
  'GKDI Pekanbaru',
] as const;

const MINISTRY_OPTIONS = ['Teens/Campus', 'Single/S2', 'Married'] as const;

const profileFormSchema = z.object({
  fullName: z.string().min(1, 'Nama lengkap harus diisi').max(150, 'Nama lengkap maksimal 150 karakter'),
  churchName: z.string().min(1, 'Pilih asal gereja'),
  ministry: z.enum(MINISTRY_OPTIONS, { required_error: 'Pilih pelayanan' }),
  customChurchName: z.string().optional(),
  contactEmail: z.string().email('Email tidak valid').optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
  specialNotes: z.string().optional(),
}).refine((data) => {
  if (data.churchName === 'Lainnya') {
    return data.customChurchName && data.customChurchName.trim().length > 0;
  }
  return true;
}, {
  message: 'Masukkan nama gereja',
  path: ['customChurchName'],
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export function ProfileMePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [registration, setRegistration] = useState<RegistrationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
  });

  const churchName = watch('churchName');
  const isOtherSelected = churchName === 'Lainnya';

  useEffect(() => {
    async function loadData() {
      try {
        const profileData = await apiClient.getMyProfile();
        setProfile(profileData);

        // Load registration data for phone number
        try {
          const registrationData = await apiClient.getMyRegistration();
          if (registrationData) {
            setRegistration(registrationData);
          }
        } catch (regError) {
          // Registration not found, that's fine
        }

        // Check if edit mode should be enabled from query parameter
        const editParam = searchParams.get('edit');
        if (editParam === 'true') {
          setIsEditMode(true);
        }

        // Auto-fill form with profile data
        setValue('fullName', profileData.fullName);
        
        // Check if churchName is custom
        const isCustomChurch = !CHURCH_OPTIONS.includes(profileData.churchName as typeof CHURCH_OPTIONS[number]);
        if (isCustomChurch) {
          setValue('churchName', 'Lainnya');
          setValue('customChurchName', profileData.churchName);
        } else {
          setValue('churchName', profileData.churchName);
        }
        
        setValue('ministry', MINISTRY_OPTIONS.includes(profileData.ministry as typeof MINISTRY_OPTIONS[number]) ? profileData.ministry as typeof MINISTRY_OPTIONS[number] : MINISTRY_OPTIONS[0]);
        setValue('contactEmail', profileData.contactEmail || '');
        setValue('phoneNumber', profileData.phoneNumber || '');
        setValue('specialNotes', profileData.specialNotes || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat profil');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [router, searchParams, setValue]);

  const handleEdit = () => {
    setIsEditMode(true);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async (data: ProfileFormData) => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      const finalChurchName = data.churchName === 'Lainnya' && data.customChurchName
        ? data.customChurchName
        : data.churchName;
      
      // Update profile
      const profileData = {
        fullName: data.fullName,
        churchName: finalChurchName,
        ministry: data.ministry,
        contactEmail: data.contactEmail || undefined,
        phoneNumber: data.phoneNumber || undefined,
        specialNotes: data.specialNotes || undefined,
      };
      
      const updatedProfile = await apiClient.updateProfile(profileData);
      setProfile(updatedProfile);
      
      // Note: Phone number is stored in registration, but we don't update it here
      // as registration only contains payment proof and status
      // Phone number should be managed separately if needed
      
      setIsEditMode(false);
      
      // Check if user came from a specific page and redirect back immediately
      const returnTo = searchParams.get('returnTo');
      if (returnTo) {
        // Redirect immediately with success parameter
        router.push(`${returnTo}?profileUpdated=true`);
      } else {
        setSuccess('Profil berhasil diperbarui');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan profil');
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <DashboardLayout>
      {isLoading ? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 lg:h-12 lg:w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-sm lg:text-base xl:text-lg text-gray-600">Loading...</p>
          </div>
        </div>
      ) : error && !profile ? (
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl text-center">
            <div className="rounded-md bg-red-50 p-4 lg:p-5">
              <p className="text-sm lg:text-base text-red-800">{error}</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 lg:mt-6 text-sm lg:text-base xl:text-lg text-blue-600 hover:text-blue-500"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      ) : (
      <div className="mx-auto max-w-4xl lg:max-w-5xl xl:max-w-6xl">
          {/* Judul */}
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-6 lg:mb-8 text-center lg:text-left">
            Profil Saya
          </h1>

          {/* Form Data Diri */}
          <div className="bg-white rounded-lg shadow-md p-6 lg:p-8 xl:p-10 mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-4 sm:mb-0">
                Data Diri
              </h2>
              {/* Desktop Button */}
              <div className="hidden lg:block">
                {!isEditMode ? (
                  <button
                    onClick={handleEdit}
                    className="rounded-md bg-blue-600 px-4 py-2 lg:px-6 lg:py-3 text-sm lg:text-base xl:text-lg font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Edit Profil
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit(handleSave)}
                    disabled={isSaving}
                    className="rounded-md bg-green-600 px-4 py-2 lg:px-6 lg:py-3 text-sm lg:text-base xl:text-lg font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
                <p className="text-sm lg:text-base text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-6">
                <p className="text-sm lg:text-base text-green-800">{success}</p>
              </div>
            )}

            {isEditMode ? (
              <form onSubmit={handleSubmit(handleSave)} className="space-y-5 lg:space-y-6">
                {/* Nama */}
                <div>
                  <label htmlFor="fullName" className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                    Nama *
                  </label>
                  <input
                    {...register('fullName')}
                    type="text"
                    className="block w-full rounded-lg border border-gray-300 px-4 py-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all text-sm lg:text-base xl:text-lg bg-white"
                  />
                  {errors.fullName && (
                    <p className="mt-2 text-sm lg:text-base text-red-600">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* Gereja Asal */}
                <div>
                  <label htmlFor="churchName" className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                    Asal Gereja *
                  </label>
                  <div className="relative">
                    <select
                      {...register('churchName')}
                      defaultValue=""
                      className={`block w-full rounded-lg border border-gray-300 px-4 py-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 pr-10 lg:pr-12 xl:pr-14 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all text-base lg:text-base xl:text-lg appearance-none bg-white cursor-pointer ${
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
                        className="block w-full rounded-lg border border-gray-300 px-4 py-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all text-sm lg:text-base xl:text-lg bg-white"
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

                {/* Ministry */}
                <div>
                  <label htmlFor="ministry" className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                    Ministry *
                  </label>
                  <div className="relative">
                    <select
                      {...register('ministry')}
                      defaultValue=""
                      className={`block w-full rounded-lg border border-gray-300 px-4 py-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 pr-10 lg:pr-12 xl:pr-14 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all text-base lg:text-base xl:text-lg appearance-none bg-white cursor-pointer ${
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

                {/* Email */}
                <div>
                  <label htmlFor="contactEmail" className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    {...register('contactEmail')}
                    type="email"
                    className="block w-full rounded-lg border border-gray-300 px-4 py-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all text-sm lg:text-base xl:text-lg bg-white"
                    placeholder="contoh@email.com"
                  />
                  {errors.contactEmail && (
                    <p className="mt-2 text-sm lg:text-base text-red-600">
                      {errors.contactEmail.message}
                    </p>
                  )}
                </div>

                {/* Nomor HP */}
                <div>
                  <label htmlFor="phoneNumber" className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                    No. HP
                  </label>
                  <input
                    {...register('phoneNumber')}
                    type="tel"
                    className="block w-full rounded-lg border border-gray-300 px-4 py-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all text-sm lg:text-base xl:text-lg bg-white"
                    placeholder="08xxxxxxxxxx"
                  />
                  {errors.phoneNumber && (
                    <p className="mt-2 text-sm lg:text-base text-red-600">
                      {errors.phoneNumber.message}
                    </p>
                  )}
                </div>

                {/* Catatan Khusus */}
                <div>
                  <label htmlFor="specialNotes" className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                    Catatan Khusus (Alergi/Penyakit/Catatan lainnya)
                  </label>
                  <textarea
                    {...register('specialNotes')}
                    rows={4}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-3 lg:px-5 lg:py-3.5 xl:px-6 xl:py-4 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all text-sm lg:text-base xl:text-lg resize-none bg-white"
                    placeholder="Alergi/sakit/dll"
                  />
                  {errors.specialNotes && (
                    <p className="mt-2 text-sm lg:text-base text-red-600">
                      {errors.specialNotes.message}
                    </p>
                  )}
                </div>

                {/* Mobile Save Button */}
                <div className="mt-6 lg:hidden w-full">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-5 lg:space-y-6">
                {/* Nama */}
                <div>
                  <label className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                    Nama
                  </label>
                  <p className="text-sm lg:text-base xl:text-lg text-gray-900">
                    {profile?.fullName || '-'}
                  </p>
                </div>

                {/* Gereja Asal */}
                <div>
                  <label className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                    Asal Gereja
                  </label>
                  <p className="text-sm lg:text-base xl:text-lg text-gray-900">
                    {profile?.churchName || '-'}
                  </p>
                </div>

                {/* Ministry */}
                <div>
                  <label className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                    Ministry
                  </label>
                  <p className="text-sm lg:text-base xl:text-lg text-gray-900">
                    {profile?.ministry || '-'}
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                    Email
                  </label>
                  <p className="text-sm lg:text-base xl:text-lg text-gray-900">
                    {profile?.contactEmail || '-'}
                  </p>
                </div>

                {/* Nomor HP */}
                <div>
                  <label className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                    No. HP
                  </label>
                  <p className="text-sm lg:text-base xl:text-lg text-gray-900">
                    {profile?.phoneNumber || '-'}
                  </p>
                </div>

                {/* Catatan Khusus */}
                <div>
                  <label className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                    Catatan Khusus (Alergi/Penyakit/Catatan lainnya)  
                  </label>
                  <p className="text-sm lg:text-base xl:text-lg text-gray-900 whitespace-pre-wrap">
                    {profile?.specialNotes || '-'}
                  </p>
                </div>

                {/* Mobile Edit Button */}
                <div className="mt-6 lg:hidden w-full">
                  <button
                    onClick={handleEdit}
                    className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Edit Profil
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
