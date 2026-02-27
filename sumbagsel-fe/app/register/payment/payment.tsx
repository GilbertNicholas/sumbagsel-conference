'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, getPaymentProofFullUrl, ProfileResponse, RegistrationResponse } from '@/lib/api-client';
import { DashboardLayout } from '@/components/dashboard-layout';

const CHILD_FEE = 75_000;

function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n);
}

export function PaymentPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [registration, setRegistration] = useState<RegistrationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canUpload = registration?.status === 'Belum terdaftar' || registration?.status === 'Daftar ulang';

  useEffect(() => {
    async function loadData() {
      try {
        // Check if registration was passed from register page via sessionStorage
        let regFromStorage: RegistrationResponse | null = null;
        if (typeof window !== 'undefined') {
          const stored = sessionStorage.getItem('registrationFromRegister');
          if (stored) {
            sessionStorage.removeItem('registrationFromRegister');
            try {
              regFromStorage = JSON.parse(stored) as RegistrationResponse;
            } catch {}
          }
        }

        const profileData = await apiClient.getMyProfile();
        if (!profileData) {
          router.replace('/profile/setup');
          return;
        }
        setProfile(profileData);

        if (regFromStorage) {
          setRegistration(regFromStorage);
        } else {
          const registrationData = await apiClient.getMyRegistration();
          setRegistration(registrationData);
          if (!registrationData) {
            router.replace('/register');
          }
        }
      } catch {
        router.replace('/register');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const handleRemoveFile = () => setUploadedFile(null);

  const handleUploadAndSubmit = async () => {
    if (!registration || !uploadedFile) {
      setError('Pilih file bukti pembayaran terlebih dahulu');
      return;
    }
    try {
      setError(null);
      setIsUploading(true);

      const { url } = await apiClient.uploadPaymentProof(uploadedFile);
      await apiClient.updateRegistration({ paymentProofUrl: url });
      await apiClient.submitRegistration();

      const updated = await apiClient.getMyRegistration();
      setRegistration(updated);
      setUploadedFile(null);
      setSuccess('Bukti pembayaran berhasil diunggah. Menunggu verifikasi admin.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah bukti pembayaran');
    } finally {
      setIsUploading(false);
    }
  };

  const ministryFee =
    registration?.baseAmount != null && registration?.children
      ? registration.baseAmount - registration.children.length * CHILD_FEE
      : 0;

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

  if (!registration) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl lg:max-w-5xl xl:max-w-6xl">
        <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-6 lg:mb-8 text-center lg:text-left">
          Pembayaran
        </h1>

        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => router.push('/register')}
            className="text-sm lg:text-base text-blue-600 hover:text-blue-500"
          >
            ← Kembali ke Daftar Konferensi
          </button>
        </div>

        {success && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm lg:text-base text-green-800">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm lg:text-base text-red-800">{error}</p>
          </div>
        )}

        {/* Invoice Section */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:p-8 xl:p-10 mb-6 lg:mb-8">
          <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-6">
            Invoice
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm lg:text-base">
              <span className="text-gray-700">Biaya pelayanan ({profile?.ministry || '-'})</span>
              <span className="text-gray-900">Rp {formatRupiah(ministryFee)}</span>
            </div>
            {registration.children?.map((c) => (
              <div key={c.id} className="flex justify-between text-sm lg:text-base">
                <span className="text-gray-700">Anak: {c.name} (usia {c.age} tahun)</span>
                <span className="text-gray-900">Rp {formatRupiah(CHILD_FEE)}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between text-sm lg:text-base">
              <span className="text-gray-700 font-medium">Subtotal</span>
              <span className="text-gray-900 font-medium">Rp {formatRupiah(registration.baseAmount ?? 0)}</span>
            </div>
            <div className="flex justify-between text-sm lg:text-base">
              <span className="text-gray-700">Kode unik</span>
              <span className="text-gray-900 font-mono">{registration.uniqueCode ?? '-'}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between text-base lg:text-lg font-bold">
              <span className="text-gray-900">Total transfer</span>
              <span className="text-gray-900">Rp {formatRupiah(registration.totalAmount ?? 0)}</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Transfer ke rekening yang tertera. Gunakan total transfer di atas (termasuk kode unik) agar pembayaran dapat teridentifikasi.
          </p>
        </div>

        {/* Upload Section - only when Belum terdaftar */}
        {canUpload && (
          <div className="bg-white rounded-lg shadow-md p-6 lg:p-8 xl:p-10 mb-6 lg:mb-8">
            <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-6">
              Upload Bukti Pembayaran
            </h2>
            {!uploadedFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 lg:p-12 text-center">
                <input
                  type="file"
                  id="paymentProof"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="paymentProof" className="flex flex-col items-center cursor-pointer">
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
                      <p className="text-sm lg:text-base xl:text-lg font-medium text-gray-900">{uploadedFile.name}</p>
                      <p className="text-xs lg:text-sm text-gray-500">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="rounded-md px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            )}
            <div className="mt-6">
              <button
                onClick={handleUploadAndSubmit}
                disabled={!uploadedFile || isUploading}
                className="rounded-md bg-blue-600 px-6 py-3 text-sm lg:text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? 'Mengunggah...' : 'Upload bukti bayar'}
              </button>
            </div>
          </div>
        )}

        {/* When Pending or Terdaftar - show payment proof if exists */}
        {!canUpload && registration.paymentProofUrl && (() => {
          const fullUrl = getPaymentProofFullUrl(registration.paymentProofUrl);
          if (!fullUrl) return null;
          const isImage = registration.paymentProofUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
          return (
            <div className="bg-white rounded-lg shadow-md p-6 lg:p-8 xl:p-10 mb-6 lg:mb-8">
              <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-4">
                Bukti Pembayaran
              </h2>
              <p className="text-sm text-gray-600 mb-2">Status: {registration.status}</p>
              {isImage ? (
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={fullUrl}
                    alt="Bukti pembayaran"
                    className="max-w-md rounded-lg border border-gray-200"
                  />
                </a>
              ) : (
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-500 underline"
                >
                  Lihat bukti pembayaran
                </a>
              )}
            </div>
          );
        })()}
      </div>
    </DashboardLayout>
  );
}
