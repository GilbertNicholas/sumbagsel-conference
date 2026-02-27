'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient, getPaymentProofFullUrl, ParticipantDetailResponse } from '@/lib/api-client';

const CHILD_FEE = 75_000;

function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n);
}

export function ParticipantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const registrationId = params.id as string;
  
  const [participant, setParticipant] = useState<ParticipantDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isCheckIn, setIsCheckIn] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiClient.getParticipantById(registrationId);
        setParticipant(data);
      } catch (err) {
        if (err instanceof Error && err.message.includes('No admin token')) {
          router.push('/admin');
          return;
        }
        setError(err instanceof Error ? err.message : 'Gagal memuat data peserta');
      } finally {
        setIsLoading(false);
      }
    }

    if (registrationId) {
      loadData();
    }
  }, [registrationId, router]);

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      setError(null);
      const updated = await apiClient.approveRegistration(registrationId);
      setParticipant(updated);
      setShowConfirmModal(false);
      setSuccess('Pendaftaran berhasil disetujui');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyetujui pendaftaran');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsRejecting(true);
      setError(null);
      const updated = await apiClient.rejectRegistration(registrationId);
      setParticipant(updated);
      setShowRejectModal(false);
      setSuccess('Pendaftaran ditolak. Status berubah menjadi Daftar ulang.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menolak pendaftaran');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setIsCheckIn(true);
      setError(null);
      const updated = await apiClient.checkInParticipant(registrationId);
      setParticipant(updated);
      setShowCheckInModal(false);
      setSuccess('Peserta berhasil check-in');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal melakukan check-in');
    } finally {
      setIsCheckIn(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Belum terdaftar':
        return 'text-red-600';
      case 'Pending':
        return 'text-yellow-600';
      case 'Terdaftar':
        return 'text-green-600';
      case 'Daftar ulang':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const isPending = participant?.status === 'Pending';
  const isTerdaftar = participant?.status === 'Terdaftar';
  const canCheckIn = isTerdaftar && !participant?.checkedInAt;
  const hasCheckedIn = participant?.checkedInAt;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error && !participant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!participant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl xl:max-w-[95%] 2xl:max-w-[98%] mx-auto px-[10%]">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                Detail Peserta
              </h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => {
                  apiClient.adminLogout();
                  router.push('/admin');
                }}
                className="px-4 py-2 text-sm lg:text-base font-medium text-gray-700 hover:text-gray-900"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl xl:max-w-[95%] 2xl:max-w-[98%] mx-auto px-[10%] py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <p className="text-sm lg:text-base font-medium text-green-800">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm lg:text-base font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Section 1: Data Diri Peserta */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6 lg:mb-8">
          <div className="px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900">
                  Data Diri Peserta
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-base lg:text-lg xl:text-xl text-gray-500">
                    Status: <span className={`font-medium ${getStatusColor(participant.status)}`}>
                      {participant.status}
                    </span>
                  </span>
                  {hasCheckedIn && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Sudah check-in
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {isPending && (
                  <>
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={isApproving || isRejecting}
                      className="px-6 py-3 lg:px-8 lg:py-4 rounded-md text-base lg:text-lg xl:text-xl font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Setujui Pendaftaran
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={isApproving || isRejecting}
                      className="px-6 py-3 lg:px-8 lg:py-4 rounded-md text-base lg:text-lg xl:text-xl font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      Tolak Pendaftaran
                    </button>
                  </>
                )}
                {canCheckIn && (
                  <button
                    onClick={() => setShowCheckInModal(true)}
                    disabled={isCheckIn}
                    className="px-6 py-3 lg:px-8 lg:py-4 rounded-md text-base lg:text-lg xl:text-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Check-in Peserta
                  </button>
                )}
                {isTerdaftar && hasCheckedIn && (
                  <span className="px-6 py-3 lg:px-8 lg:py-4 rounded-md text-base lg:text-lg xl:text-xl font-medium bg-gray-200 text-gray-600">
                    Sudah check-in
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10 space-y-6 lg:space-y-8">
            <div>
              <label className="block text-base lg:text-lg xl:text-xl font-medium text-gray-700 mb-3">Nama Lengkap</label>
              <p className="text-base lg:text-lg xl:text-xl text-gray-900">{participant.fullName}</p>
            </div>
            <div>
              <label className="block text-base lg:text-lg xl:text-xl font-medium text-gray-700 mb-3">Asal Gereja</label>
              <p className="text-base lg:text-lg xl:text-xl text-gray-900">{participant.churchName}</p>
            </div>
            <div>
              <label className="block text-base lg:text-lg xl:text-xl font-medium text-gray-700 mb-3">Ministry</label>
              <p className="text-base lg:text-lg xl:text-xl text-gray-900">{participant.ministry || '-'}</p>
            </div>
            <div>
              <label className="block text-base lg:text-lg xl:text-xl font-medium text-gray-700 mb-3">Email</label>
              <p className="text-base lg:text-lg xl:text-xl text-gray-900">{participant.email}</p>
            </div>
            <div>
              <label className="block text-base lg:text-lg xl:text-xl font-medium text-gray-700 mb-3">No. Telp</label>
              <p className="text-base lg:text-lg xl:text-xl text-gray-900">{participant.phoneNumber || '-'}</p>
            </div>
            <div>
              <label className="block text-base lg:text-lg xl:text-xl font-medium text-gray-700 mb-3">Catatan Khusus (Alergi/Penyakit/Catatan lainnya)</label>
              <p className="text-base lg:text-lg xl:text-xl text-gray-900 whitespace-pre-wrap">{participant.specialNotes || '-'}</p>
            </div>
          </div>
        </div>

        {/* Section 2: Invoice - tampil ketika bukti pembayaran sudah dikirim dan status Pending atau Terdaftar */}
        {participant.paymentProofUrl && (participant.status === 'Pending' || participant.status === 'Terdaftar') && (participant.baseAmount != null || participant.totalAmount != null) && (
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6 lg:mb-8">
            <div className="px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
              <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-6">
                Invoice
              </h2>
              <div className="space-y-3">
                {participant.baseAmount != null && (
                  <>
                    <div className="flex justify-between text-sm lg:text-base">
                      <span className="text-gray-700">Biaya pelayanan ({participant.ministry || '-'})</span>
                      <span className="text-gray-900">
                        Rp {formatRupiah(
                          participant.baseAmount -
                            ((participant.children?.length ?? 0) * CHILD_FEE)
                        )}
                      </span>
                    </div>
                    {(participant.children ?? []).map((c) => (
                      <div key={c.id} className="flex justify-between text-sm lg:text-base">
                        <span className="text-gray-700">Anak: {c.name} (usia {c.age} tahun)</span>
                        <span className="text-gray-900">Rp {formatRupiah(CHILD_FEE)}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between text-sm lg:text-base">
                      <span className="text-gray-700 font-medium">Subtotal</span>
                      <span className="text-gray-900 font-medium">Rp {formatRupiah(participant.baseAmount)}</span>
                    </div>
                  </>
                )}
                {participant.uniqueCode && (
                  <div className="flex justify-between text-sm lg:text-base">
                    <span className="text-gray-700">Kode unik</span>
                    <span className="text-gray-900 font-mono">{participant.uniqueCode}</span>
                  </div>
                )}
                {participant.totalAmount != null && (
                  <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between text-base lg:text-lg font-bold">
                    <span className="text-gray-900">Total transfer</span>
                    <span className="text-gray-900">Rp {formatRupiah(participant.totalAmount)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Bukti Pembayaran */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-6">
              Bukti Pembayaran
            </h2>
            {participant.paymentProofUrl ? (
              <div>
                <a
                  href={getPaymentProofFullUrl(participant.paymentProofUrl) ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-3 lg:px-6 lg:py-4 border border-gray-300 rounded-md shadow-sm text-base lg:text-lg font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-6 h-6 lg:w-7 lg:h-7 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Lihat Bukti Pembayaran
                </a>
              </div>
            ) : (
              <p className="text-base lg:text-lg xl:text-xl text-gray-500">Tidak ada bukti pembayaran</p>
            )}
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showConfirmModal && (
        <>
          <div
            className="fixed inset-0 backdrop-blur-md z-40"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            onClick={() => !isApproving && setShowConfirmModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto pointer-events-none">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-50 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">Konfirmasi Persetujuan</h3>
                <p className="text-sm lg:text-base text-gray-600 mb-6">
                  Apakah Anda yakin ingin menyetujui pendaftaran peserta ini? Status akan berubah menjadi &quot;Terdaftar&quot;.
                </p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowConfirmModal(false)} disabled={isApproving} className="px-4 py-2 text-sm lg:text-base font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50">Batal</button>
                  <button onClick={handleApprove} disabled={isApproving} className="px-4 py-2 text-sm lg:text-base font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50">{isApproving ? 'Memproses...' : 'Setujui'}</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <>
          <div
            className="fixed inset-0 backdrop-blur-md z-40"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            onClick={() => !isRejecting && setShowRejectModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto pointer-events-none">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-50 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">Konfirmasi Penolakan</h3>
                <p className="text-sm lg:text-base text-gray-600 mb-6">
                  Apakah Anda yakin ingin menolak pendaftaran peserta ini? Status akan berubah menjadi &quot;Daftar ulang&quot; dan peserta akan diminta untuk mendaftar ulang.
                </p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowRejectModal(false)} disabled={isRejecting} className="px-4 py-2 text-sm lg:text-base font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50">Batal</button>
                  <button onClick={handleReject} disabled={isRejecting} className="px-4 py-2 text-sm lg:text-base font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50">{isRejecting ? 'Memproses...' : 'Tolak'}</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Check-in Modal */}
      {showCheckInModal && (
        <>
          <div
            className="fixed inset-0 backdrop-blur-md z-40"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            onClick={() => !isCheckIn && setShowCheckInModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto pointer-events-none">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-50 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">Konfirmasi Check-in</h3>
                <p className="text-sm lg:text-base text-gray-600 mb-6">
                  Apakah Anda yakin ingin melakukan check-in peserta ini? Tindakan ini menandakan peserta telah hadir di lokasi.
                </p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowCheckInModal(false)} disabled={isCheckIn} className="px-4 py-2 text-sm lg:text-base font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50">Batal</button>
                  <button onClick={handleCheckIn} disabled={isCheckIn} className="px-4 py-2 text-sm lg:text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50">{isCheckIn ? 'Memproses...' : 'Check-in'}</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
