'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, getPaymentProofFullUrl, ProfileResponse, RegistrationResponse } from '@/lib/api-client';
import { DashboardLayout } from '@/components/dashboard-layout';
import { FEATURES } from '@/lib/features';

const CHILD_FEE = 75_000;
const SHIRT_EXTRA_FEE = 75_000;
const ACCOUNT_NUMBER = '7195 300 500';
const ACCOUNT_NAME = 'Yayasan Gema Kristus Damai Indonesia';

function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n);
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 p-1 rounded hover:bg-gray-100 transition-colors"
      title={`Salin ${label}`}
      aria-label={`Salin ${label}`}
    >
      {copied ? (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-500 hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

export function PaymentPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [registration, setRegistration] = useState<RegistrationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPreviewZoomModal, setShowPreviewZoomModal] = useState(false);
  const [showUploadedProofZoomModal, setShowUploadedProofZoomModal] = useState(false);

  const canUpload = registration?.status === 'Belum terdaftar' || registration?.status === 'Daftar ulang';
  const showUbahData =
    (registration?.status === 'Belum terdaftar' || registration?.status === 'Daftar ulang') &&
    registration?.baseAmount != null;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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
    if (file) {
      setUploadedFile(file);
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setUploadedFile(null);
  };

  const handleDaftarkanSayaClick = () => {
    if (!uploadedFile) {
      setError('Pilih file bukti pembayaran terlebih dahulu');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmDaftar = async () => {
    setShowConfirmModal(false);
    await handleUploadAndSubmit();
  };

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
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setUploadedFile(null);
      setSuccess('Bukti pembayaran berhasil diunggah. Menunggu verifikasi admin.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah bukti pembayaran');
    } finally {
      setIsUploading(false);
    }
  };

  const childFeesTotal = (registration?.children ?? []).reduce(
    (sum, c) => sum + ((c.needsConsumption ?? true) ? CHILD_FEE : 0),
    0,
  );
  const shirtCount = (registration?.shirtSizes ?? (registration?.shirtSize ? [registration.shirtSize] : [])).length;
  const shirtExtraFees = shirtCount > 1 ? (shirtCount - 1) * SHIRT_EXTRA_FEE : 0;
  const ministryFee =
    registration?.baseAmount != null
      ? registration.baseAmount - childFeesTotal - shirtExtraFees
      : 0;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Terdaftar':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Daftar ulang':
        return 'bg-blue-100 text-blue-800';
      case 'Belum terdaftar':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUbahDataPendaftaran = async () => {
    if (!registration) return;
    try {
      setError(null);
      setIsResetting(true);
      if (registration.status === 'Belum terdaftar' || registration.status === 'Daftar ulang') {
        await apiClient.resetRegistration();
        router.replace('/register');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah data pendaftaran');
    } finally {
      setIsResetting(false);
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

  if (!registration) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl bg-[#F5F5F0]/80 rounded-lg shadow-md p-6 lg:p-8">
        <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-6 lg:mb-8 text-center lg:text-left flex flex-wrap items-center gap-2">
          Pembayaran <span className={`inline-block px-3 py-1 rounded-full text-lg lg:text-xl font-semibold ${getStatusStyle(registration.status)}`}>{registration.status}</span>
        </h1>

        {showUbahData && (
          <div className="mb-6">
            <button
              onClick={handleUbahDataPendaftaran}
              disabled={isResetting}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-amber-500 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 shadow-sm transition-all hover:border-amber-600 hover:bg-amber-100 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {isResetting ? 'Memproses...' : 'Ubah data pendaftaran'}
            </button>
          </div>
        )}

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

        {registration.status === 'Daftar ulang' && registration.rejectReason && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm font-medium text-red-800 mb-2">Alasan penolakan pendaftaran:</p>
            <p className="text-sm lg:text-base text-gray-800 whitespace-pre-wrap">{registration.rejectReason}</p>
          </div>
        )}

        {/* Invoice Section */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:p-8 xl:p-10 mb-6 lg:mb-8">
          <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-6">
            Invoice
          </h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm lg:text-base">
                <span className="text-gray-700">
                  Biaya pendaftaran ({profile?.ministry || '-'}) a/n {profile?.fullName || '-'}
                </span>
                <span className="text-gray-900">Rp {formatRupiah(ministryFee)}</span>
              </div>
            </div>
            {(registration.shirtSizes ?? (registration.shirtSize ? [registration.shirtSize] : [])).filter(Boolean).map((size, idx) => (
              <div key={idx} className="flex justify-between text-sm lg:text-base">
                <span className="text-gray-700">
                  Baju {size || '-'}{idx === 0 ? ' (termasuk pendaftaran)' : ''}
                </span>
                <span className="text-gray-900">Rp {formatRupiah(idx === 0 ? 0 : SHIRT_EXTRA_FEE)}</span>
              </div>
            ))}
            {registration.children?.map((c) => (
              <div key={c.id} className="flex justify-between text-sm lg:text-base">
                <span className="text-gray-700">Anak: {c.name} (usia {c.age} tahun){!(c.needsConsumption ?? true) && ' - tanpa konsumsi'}</span>
                <span className="text-gray-900">Rp {formatRupiah((c.needsConsumption ?? true) ? CHILD_FEE : 0)}</span>
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
            <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between items-center text-base lg:text-lg font-bold">
              <span className="text-gray-900">Total transfer</span>
              <span className="flex items-center gap-1">
                Rp {formatRupiah(registration.totalAmount ?? 0)}
                <CopyButton text={String(registration.totalAmount ?? 0)} label="nominal transfer" />
              </span>
            </div>
            {/* Registration ID (hanya ketika Terdaftar) atau Nomor rekening (sebelum Terdaftar) */}
            {registration.status === 'Terdaftar' && registration.registrationId ? (
              <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600 mb-2">Registration ID</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="text-2xl lg:text-3xl xl:text-4xl font-bold text-green-600 tracking-wider">
                    {registration.registrationId}
                  </span>
                  <CopyButton text={registration.registrationId} label="Registration ID" />
                </div>
              </div>
            ) : (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Transfer ke rekening:</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 tracking-wider">
                    {ACCOUNT_NUMBER}
                  </span>
                  <CopyButton text={ACCOUNT_NUMBER.replace(/\s/g, '')} label="nomor rekening" />
                </div>
                <p className="text-base lg:text-lg xl:text-xl font-semibold text-gray-800 mt-1">
                  a.n. {ACCOUNT_NAME}
                </p>
              </div>
            )}
          </div>
          <p className="mt-4 text-sm text-gray-500">
            {registration.status === 'Terdaftar' && registration.registrationId
              ? 'Simpan Registration ID Anda untuk keperluan konferensi.'
              : 'Transfer ke rekening yang tertera. Gunakan total transfer di atas (termasuk kode unik) agar pembayaran dapat teridentifikasi.'}
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {previewUrl ? (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowPreviewZoomModal(true)}
                          className="block w-full cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg overflow-hidden text-left"
                        >
                          <img
                            src={previewUrl}
                            alt="Preview bukti pembayaran"
                            className="max-h-48 lg:max-h-64 w-auto max-w-full rounded-lg border border-gray-200 object-contain hover:opacity-90 transition-opacity"
                          />
                        </button>
                        <p className="mt-2 text-xs lg:text-sm text-gray-500 truncate">
                          {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB) · Klik untuk memperbesar
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <svg className="w-8 h-8 lg:w-10 lg:h-10 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="min-w-0">
                          <p className="text-sm lg:text-base xl:text-lg font-medium text-gray-900 truncate">{uploadedFile.name}</p>
                          <p className="text-xs lg:text-sm text-gray-500">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="rounded-md px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors flex-shrink-0 self-start sm:self-center"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal zoom preview bukti pembayaran (saat file baru diupload) */}
        {showPreviewZoomModal && previewUrl && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowPreviewZoomModal(false)}
              aria-hidden
            />
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
              onClick={() => setShowPreviewZoomModal(false)}
            >
              <div className="relative max-h-[90dvh] max-w-[95vw] w-full">
                <div
                  className="relative bg-white rounded-lg shadow-2xl overflow-auto max-h-[90dvh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setShowPreviewZoomModal(false)}
                    className="absolute top-2 right-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 z-10"
                    aria-label="Tutup"
                  >
                    <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <img
                    src={previewUrl}
                    alt="Preview bukti pembayaran"
                    className="w-full h-auto object-contain max-h-[85dvh]"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tombol Daftarkan saya - di luar section upload */}
        {canUpload && (
          <div className="mb-6 lg:mb-8 flex justify-center">
            <button
              onClick={handleDaftarkanSayaClick}
              disabled={!uploadedFile || isUploading}
              className="rounded-md bg-blue-600 px-8 py-4 text-base lg:text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? 'Mengunggah...' : 'Daftarkan saya'}
            </button>
          </div>
        )}

        {/* Konfirmasi modal */}
        {showConfirmModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            aria-modal="true"
            role="dialog"
          >
            <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Konfirmasi Pendaftaran
              </h3>
              <p className="text-sm lg:text-base text-gray-700 mb-6">
                Anda yakin data sudah benar? Ketika pendaftaran disetujui oleh admin maka data pendaftaran tidak dapat diubah lagi.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDaftar}
                  disabled={isUploading}
                  className="rounded-md px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Ya, daftarkan
                </button>
              </div>
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
                <>
                  <button
                    type="button"
                    onClick={() => setShowUploadedProofZoomModal(true)}
                    className="block w-full max-w-md cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg overflow-hidden text-left"
                  >
                    <img
                      src={fullUrl}
                      alt="Bukti pembayaran"
                      className="w-full max-w-md rounded-lg border border-gray-200 object-contain hover:opacity-90 transition-opacity"
                    />
                  </button>
                  <p className="mt-1 text-xs lg:text-sm text-gray-500">Klik gambar untuk memperbesar</p>
                </>
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

        {/* Modal zoom bukti pembayaran (sudah terupload - Pending/Terdaftar) */}
        {showUploadedProofZoomModal && registration.paymentProofUrl && (() => {
          const fullUrl = getPaymentProofFullUrl(registration.paymentProofUrl);
          if (!fullUrl) return null;
          const isImage = registration.paymentProofUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
          if (!isImage) return null;
          return (
            <>
              <div
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                onClick={() => setShowUploadedProofZoomModal(false)}
                aria-hidden
              />
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
                onClick={() => setShowUploadedProofZoomModal(false)}
              >
                <div className="relative max-h-[90dvh] max-w-[95vw] w-full">
                  <div
                    className="relative bg-white rounded-lg shadow-2xl overflow-auto max-h-[90dvh]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setShowUploadedProofZoomModal(false)}
                      className="absolute top-2 right-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 z-10"
                      aria-label="Tutup"
                    >
                      <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <img
                      src={fullUrl}
                      alt="Bukti pembayaran"
                      className="w-full h-auto object-contain max-h-[85dvh]"
                    />
                  </div>
                </div>
              </div>
            </>
          );
        })()}

        {FEATURES.arrivalSchedule && registration?.status === 'Terdaftar' && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => router.push('/schedule/arrival')}
              className="rounded-full bg-[#C84343] px-8 py-3 lg:px-12 lg:py-4 xl:px-16 xl:py-5 text-base lg:text-lg xl:text-xl font-bold text-white hover:bg-[#A73535] transition-colors shadow-lg hover:shadow-xl"
            >
              Atur Jadwal Kedatangan
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
