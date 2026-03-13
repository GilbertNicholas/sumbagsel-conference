'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { formatDateOfBirthDisplay } from '@/lib/utils';
import { apiClient, ProfileResponse, RegistrationResponse, RegistrationStatus as ApiRegistrationStatus } from '@/lib/api-client';
import { DashboardLayout } from '@/components/dashboard-layout';

type RegistrationStatus = ApiRegistrationStatus;

const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const;

export function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [registration, setRegistration] = useState<RegistrationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shirtSize, setShirtSize] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSizeChartModal, setShowSizeChartModal] = useState(false);

  const canAddChildren = profile?.ministry === 'Single/S2' || profile?.ministry === 'Married';

  useEffect(() => {
    async function loadData() {
      try {
        const profileData = await apiClient.getMyProfile();
        if (!profileData) {
          router.push('/profile/setup');
          return;
        }
        setProfile(profileData);

        const registrationData = await apiClient.getMyRegistration();
        if (registrationData) {
          setRegistration(registrationData);
          if (registrationData.shirtSize && SHIRT_SIZES.includes(registrationData.shirtSize as (typeof SHIRT_SIZES)[number])) {
            setShirtSize(registrationData.shirtSize);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat data');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [router]);

  useEffect(() => {
    const profileUpdated = searchParams.get('profileUpdated');
    if (profileUpdated === 'true') {
      setSuccess('Data diri berhasil diperbarui');
      router.replace('/register', { scroll: false });
      async function reloadData() {
        try {
          const profileData = await apiClient.getMyProfile();
          setProfile(profileData);
          const registrationData = await apiClient.getMyRegistration();
          if (registrationData) setRegistration(registrationData);
        } catch {}
      }
      reloadData();
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  // Redirect ke payment jika invoice sudah ada atau status Pending/Terdaftar/Daftar ulang
  useEffect(() => {
    if (!isLoading && registration) {
      const shouldRedirectToPayment =
        registration.status === 'Pending' ||
        registration.status === 'Terdaftar' ||
        registration.status === 'Daftar ulang' ||
        (registration.status === 'Belum terdaftar' && registration.baseAmount != null);
      if (shouldRedirectToPayment) {
        router.replace('/register/payment');
      }
    }
  }, [isLoading, registration, router]);

  const handleLanjut = async () => {
    setError(null);

    const hasValidShirtSize = shirtSize && SHIRT_SIZES.includes(shirtSize as (typeof SHIRT_SIZES)[number]);
    if (!hasValidShirtSize) {
      setError('Pilih size baju terlebih dahulu');
      return;
    }

    if (canAddChildren) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('registerShirtSize', shirtSize);
      }
      router.push('/register/children');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = { shirtSize, children: [] };
      const updated = await apiClient.createRegistrationWithChildren(payload);
      setRegistration(updated);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('registrationFromRegister', JSON.stringify(updated));
      }
      router.push('/register/payment?t=' + Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses pendaftaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 lg:h-12 lg:w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            <p className="mt-4 text-sm lg:text-base xl:text-lg text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !profile) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg bg-red-50 border border-red-200 p-6">
            <p className="text-sm lg:text-base text-red-800 mb-4">{error}</p>
            <button
              onClick={async () => {
                setError(null);
                setIsLoading(true);
                try {
                  const p = await apiClient.getMyProfile();
                  if (!p) router.push('/profile/setup');
                  else setProfile(p);
                  const r = await apiClient.getMyRegistration();
                  if (r) setRegistration(r);
                } catch {
                  setError('Gagal memuat data');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Coba lagi
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (registration && (registration.status === 'Pending' || registration.status === 'Terdaftar' || registration.status === 'Daftar ulang' || (registration.status === 'Belum terdaftar' && registration.baseAmount != null))) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl lg:max-w-5xl xl:max-w-6xl pb-12 sm:pb-16 lg:pb-0">
        <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-6 lg:mb-8 text-center lg:text-left">
          Pendaftaran Konferensi
        </h1>

        {success && (
          <div className="mb-6 lg:mb-8 rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm lg:text-base text-green-800">{success}</p>
          </div>
        )}

        {/* Data Diri */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:p-8 xl:p-10 mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-4 sm:mb-0">
              Data Diri
            </h2>
            <div className="hidden lg:block">
              <button
                onClick={() => router.push('/profile/me?edit=true&returnTo=/register')}
                className="rounded-md bg-blue-600 px-4 py-2 lg:px-6 lg:py-3 text-sm lg:text-base xl:text-lg font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Edit data diri
              </button>
            </div>
          </div>
          <div className="space-y-5 lg:space-y-6">
            <div>
              <label className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">Nama</label>
              <p className="text-sm lg:text-base xl:text-lg text-gray-900">{profile?.fullName || '-'}</p>
            </div>
            <div>
              <label className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">Asal Gereja</label>
              <p className="text-sm lg:text-base xl:text-lg text-gray-900">{profile?.churchName || '-'}</p>
            </div>
            <div>
              <label className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">Ministry</label>
              <p className="text-sm lg:text-base xl:text-lg text-gray-900">{profile?.ministry || '-'}</p>
            </div>
            <div>
              <label className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">Gender</label>
              <p className="text-sm lg:text-base xl:text-lg text-gray-900">{profile?.gender || '-'}</p>
            </div>
            <div>
              <label className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">Tanggal Lahir</label>
              <p className="text-sm lg:text-base xl:text-lg text-gray-900">{profile?.dateOfBirth ? formatDateOfBirthDisplay(profile.dateOfBirth) : '-'}</p>
            </div>
            <div>
              <label className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">Email</label>
              <p className="text-sm lg:text-base xl:text-lg text-gray-900">{profile?.contactEmail || '-'}</p>
            </div>
            <div>
              <label className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">No. Telp</label>
              <p className="text-sm lg:text-base xl:text-lg text-gray-900">{profile?.phoneNumber || '-'}</p>
            </div>
            <div>
              <label className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">Catatan Khusus (Alergi/Penyakit/Catatan lainnya)</label>
              <p className="text-sm lg:text-base xl:text-lg text-gray-900 whitespace-pre-wrap">{profile?.specialNotes || '-'}</p>
            </div>
          </div>
          <div className="mt-6 lg:hidden w-full">
            <button
              onClick={() => router.push('/profile/me?edit=true&returnTo=/register')}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Edit data diri
            </button>
          </div>
        </div>

        {/* Pilih size baju */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8 xl:p-10 mb-6 lg:mb-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-2">
            Pilih size baju Sumbagsel <span className="text-red-600">*</span>
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-4">
            Baju hanya diberikan untuk peserta yang terdaftar pada data diri di atas.
          </p>
          <div className="mb-4 overflow-x-auto">
            <button
              type="button"
              onClick={() => setShowSizeChartModal(true)}
              className="block w-full max-w-md cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg overflow-hidden"
            >
              <Image
                src="/images/size-chart.png"
                alt="Tabel ukuran kaos - Klik untuk memperbesar"
                width={400}
                height={300}
                className="w-full max-w-md rounded-lg border border-gray-200 object-contain hover:opacity-90 transition-opacity"
              />
            </button>
            <p className="mt-1 text-xs text-gray-500">Klik gambar untuk memperbesar</p>
          </div>

          {showSizeChartModal && (
            <>
              <div
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                onClick={() => setShowSizeChartModal(false)}
                aria-hidden
              />
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={() => setShowSizeChartModal(false)}
              >
                <div className="relative max-h-[90vh] max-w-[95vw]">
                  <button
                    type="button"
                    onClick={() => setShowSizeChartModal(false)}
                    className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Tutup"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div
                    className="bg-white rounded-lg shadow-2xl overflow-auto max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Image
                      src="/images/size-chart.png"
                      alt="Tabel ukuran kaos"
                      width={800}
                      height={600}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          <div>
            <label className="block mb-2 text-sm lg:text-base font-medium text-gray-700">Size baju</label>
            <select
              value={shirtSize}
              onChange={(e) => setShirtSize(e.target.value)}
              className="block w-full sm:max-w-xs rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 appearance-none bg-white"
              style={{ fontSize: '16px' }}
            >
              <option value="">Pilih size</option>
              {SHIRT_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main action button */}
        <div className="mt-8 lg:mt-10 flex flex-col items-center gap-4">
          {error && (
            <div className="w-full max-w-xl rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm lg:text-base text-red-800">{error}</p>
            </div>
          )}
          <button
            onClick={handleLanjut}
            disabled={isSubmitting}
            className="rounded-full px-8 py-3 lg:px-12 lg:py-4 xl:px-16 xl:py-5 text-base lg:text-lg xl:text-xl font-bold text-white transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed bg-[#C84343] hover:bg-[#A73535] hover:shadow-xl"
          >
            {isSubmitting ? 'Memproses...' : canAddChildren ? 'Lanjutkan pendaftaran' : 'Lanjut ke pembayaran'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
