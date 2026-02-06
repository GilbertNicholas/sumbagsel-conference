'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient, ProfileResponse, RegistrationResponse, RegistrationStatus as ApiRegistrationStatus } from '@/lib/api-client';
import { DashboardLayout } from '@/components/dashboard-layout';

type RegistrationStatus = ApiRegistrationStatus;

export function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>('Belum terdaftar');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [registration, setRegistration] = useState<RegistrationResponse | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const profileData = await apiClient.getMyProfile();
        setProfile(profileData);
        
        // Try to load registration data
        try {
          const registrationData = await apiClient.getMyRegistration();
          if (registrationData) {
            setRegistration(registrationData);
            setRegistrationStatus(registrationData.status);
          }
        } catch (regError) {
          // Registration not found, that's fine
        }
      } catch (error) {
        router.push('/profile/setup');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [router]);

  // Check for profile update success message
  useEffect(() => {
    const profileUpdated = searchParams.get('profileUpdated');
    if (profileUpdated === 'true') {
      setSuccess('Data diri berhasil diperbarui');
      // Remove query parameter from URL
      router.replace('/register', { scroll: false });
      // Reload data to show updated profile
      async function reloadData() {
        try {
          const profileData = await apiClient.getMyProfile();
          setProfile(profileData);
          
          try {
            const registrationData = await apiClient.getMyRegistration();
            if (registrationData) {
              setRegistration(registrationData);
              setRegistrationStatus(registrationData.status);
            }
          } catch (regError) {
            // Registration not found, that's fine
          }
        } catch (error) {
          // Ignore errors
        }
      }
      reloadData();
      
      // Auto-hide success message after 5 seconds
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
  };


  const getStatusDisplay = (status: RegistrationStatus): string => {
    if (status === 'Pending') {
      return 'Menunggu verifikasi admin';
    }
    return status;
  };

  const getStatusColor = (status: RegistrationStatus) => {
    switch (status) {
      case 'Belum terdaftar':
        return 'text-red-600';
      case 'Terdaftar':
        return 'text-green-600';
      case 'Pending':
        return 'text-yellow-600';
      case 'Daftar ulang':
        return 'text-red-600';
      default:
        return 'text-gray-600';
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
      ) : (
      <div className="mx-auto max-w-4xl lg:max-w-5xl xl:max-w-6xl">
        {/* Judul */}
        <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-6 lg:mb-8 text-center lg:text-left">
          Pendaftaran Konferensi
        </h1>

        {/* Status */}
        <div className="mb-8 lg:mb-10 text-center lg:text-left">
          <span className="text-sm lg:text-base xl:text-lg font-medium text-gray-700 mr-3">
            Status:
          </span>
          <span className={`text-sm lg:text-base xl:text-lg font-semibold ${getStatusColor(registrationStatus)}`}>
            {getStatusDisplay(registrationStatus)}
          </span>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 lg:mb-8 rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm lg:text-base text-green-800">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 lg:mb-8 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm lg:text-base text-red-800">{error}</p>
          </div>
        )}

        {/* Data Diri */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:p-8 xl:p-10 mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-4 sm:mb-0">
              Data Diri
            </h2>
            {/* Desktop Button */}
            <div className="hidden lg:block">
              <button
                onClick={() => router.push('/profile/me?edit=true&returnTo=/register')}
                className="rounded-md bg-blue-600 px-4 py-2 lg:px-6 lg:py-3 text-sm lg:text-base xl:text-lg font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Edit data diri
              </button>
            </div>
          </div>

          {/* Display Data */}
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


            {/* Email */}
            <div>
              <label className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                Email
              </label>
              <p className="text-sm lg:text-base xl:text-lg text-gray-900">
                {profile?.contactEmail || '-'}
              </p>
            </div>

            {/* No. Telp */}
            <div>
              <label className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                No. Telp
              </label>
              <p className="text-sm lg:text-base xl:text-lg text-gray-900">
                {profile?.phoneNumber || '-'}
              </p>
            </div>

            {/* Catatan Khusus */}
            <div>
              <label className="block mb-2 text-sm lg:text-base xl:text-lg font-medium text-gray-700">
                Catatan Khusus
              </label>
              <p className="text-sm lg:text-base xl:text-lg text-gray-900 whitespace-pre-wrap">
                {profile?.specialNotes || '-'}
              </p>
            </div>
          </div>

          {/* Mobile Edit Button */}
          <div className="mt-6 lg:hidden w-full">
            <button
              onClick={() => router.push('/profile/me?edit=true&returnTo=/register')}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Edit data diri
            </button>
          </div>
        </div>

        {/* Upload Bukti Pembayaran */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:p-8 xl:p-10">
          <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-6">
            Upload Bukti Pembayaran
          </h2>

          {!uploadedFile ? (
            <div className={`border-2 border-dashed rounded-lg p-8 lg:p-12 text-center ${
              registrationStatus === 'Pending' || registrationStatus === 'Terdaftar'
                ? 'border-gray-200 bg-gray-50'
                : 'border-gray-300'
            }`}>
              <input
                type="file"
                id="paymentProof"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                disabled={registrationStatus === 'Pending' || registrationStatus === 'Terdaftar'}
                className="hidden"
              />
              <label
                htmlFor="paymentProof"
                className={`flex flex-col items-center ${
                  registrationStatus === 'Pending' || registrationStatus === 'Terdaftar'
                    ? 'cursor-not-allowed opacity-60'
                    : 'cursor-pointer'
                }`}
              >
                <svg className="w-12 h-12 lg:w-16 lg:h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm lg:text-base xl:text-lg text-gray-600 mb-2">
                  Klik untuk upload atau drag & drop
                </span>
                <span className="text-xs lg:text-sm text-gray-500">
                  Format: JPG, PNG, atau PDF (Max 5MB)
                </span>
              </label>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <svg className="w-8 h-8 lg:w-10 lg:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="text-sm lg:text-base xl:text-lg font-medium text-gray-900">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs lg:text-sm text-gray-500">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveFile}
                  disabled={registrationStatus === 'Pending' || registrationStatus === 'Terdaftar'}
                  className={`rounded-md px-4 py-2 text-sm lg:text-base font-medium text-white transition-colors ${
                    registrationStatus === 'Pending' || registrationStatus === 'Terdaftar'
                      ? 'bg-gray-400 cursor-not-allowed opacity-60'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Hapus
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tombol Daftar Konferensi */}
        {registrationStatus !== 'Terdaftar' && (
          <div className="mt-8 lg:mt-10 flex justify-center">
            <button
              onClick={async () => {
                if (registrationStatus === 'Pending') return;
                try {
                  setError(null);
                  
                  // First, create or update registration with all data (special notes + payment proof)
                  // Upload file if exists
                  let paymentProofUrl: string | undefined = undefined;
                  if (uploadedFile) {
                    // In a real app, you would upload the file to a storage service
                    // For now, we'll create a data URL (not recommended for production)
                    // TODO: Implement proper file upload to storage service
                    paymentProofUrl = URL.createObjectURL(uploadedFile);
                  }
                  
                  // Create or update registration with payment proof
                  await apiClient.createRegistration({
                    paymentProofUrl: paymentProofUrl,
                  });
                  
                  // Then submit the registration
                  await apiClient.submitRegistration();
                  
                  // Reload registration data
                  const updatedRegistration = await apiClient.getMyRegistration();
                  if (updatedRegistration) {
                    setRegistration(updatedRegistration);
                    setRegistrationStatus(updatedRegistration.status);
                    setSuccess('Pendaftaran berhasil dikirim!');
                  }
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Gagal mendaftar');
                }
              }}
              disabled={registrationStatus === 'Pending'}
              className={`rounded-full px-8 py-3 lg:px-12 lg:py-4 xl:px-16 xl:py-5 text-base lg:text-lg xl:text-xl font-bold text-white transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${
                registrationStatus === 'Pending'
                  ? 'bg-gray-400'
                  : 'bg-[#C84343] hover:bg-[#A73535] hover:shadow-xl'
              }`}
            >
              Daftar konferensi
            </button>
          </div>
        )}

        {/* Tombol Atur Jadwal Kedatangan - Muncul jika Terdaftar */}
        {registrationStatus === 'Terdaftar' && (
          <div className="mt-8 lg:mt-10 flex justify-center">
            <button
              onClick={() => router.push('/schedule/arrival')}
              className="rounded-full bg-[#C84343] px-8 py-3 lg:px-12 lg:py-4 xl:px-16 xl:py-5 text-base lg:text-lg xl:text-xl font-bold text-white hover:bg-[#A73535] transition-colors shadow-lg hover:shadow-xl"
            >
              Atur Jadwal Kedatangan
            </button>
          </div>
        )}
      </div>
      )}
    </DashboardLayout>
  );
}
