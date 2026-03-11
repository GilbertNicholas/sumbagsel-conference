'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { apiClient, getPaymentProofFullUrl, ParticipantDetailResponse, AdminInfo } from '@/lib/api-client';
import { FEATURES } from '@/lib/features';
import { ParticipantDetailModals } from './participant-detail-modals';


const CHILD_FEE = 75_000;

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-3 border-b border-gray-100 last:border-0">
      <span className="font-medium text-gray-700 min-w-[220px] shrink-0 text-base lg:text-lg">{label}</span>
      <span className="text-gray-500 shrink-0">:</span>
      <span className="text-gray-900 text-base lg:text-lg">{value ?? '-'}</span>
    </div>
  );
}

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

export function ParticipantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const registrationId = params.id as string;
  
  const [participant, setParticipant] = useState<ParticipantDetailResponse | null>(null);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectReasonError, setRejectReasonError] = useState<string | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showPaymentProofModal, setShowPaymentProofModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isCheckIn, setIsCheckIn] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [participantData, adminData] = await Promise.all([
          apiClient.getParticipantById(registrationId),
          apiClient.getAdminMe(),
        ]);
        setParticipant(participantData);
        setAdminInfo(adminData);
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
    const trimmed = rejectReason.trim();
    if (!trimmed) {
      setRejectReasonError('Alasan penolakan tidak boleh kosong');
      return;
    }
    try {
      setIsRejecting(true);
      setError(null);
      setRejectReasonError(null);
      const updated = await apiClient.rejectRegistration(registrationId, trimmed);
      setParticipant(updated);
      setShowRejectModal(false);
      setRejectReason('');
      setSuccess('Pendaftaran ditolak. Status berubah menjadi Daftar ulang.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menolak pendaftaran');
    } finally {
      setIsRejecting(false);
    }
  };

  const openRejectModal = () => {
    setRejectReason('');
    setRejectReasonError(null);
    setShowRejectModal(true);
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
  const canApproveReject = adminInfo?.role === 'master';

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
    <div className="max-w-5xl xl:max-w-6xl mx-auto">
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
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-6 lg:px-8 lg:py-8 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900">
                  Data Diri Peserta
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-500">
                    Status: <span className={`font-medium ${getStatusColor(participant.status)}`}>
                      {participant.status}
                    </span>
                  </span>
                  {hasCheckedIn && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Sudah check-in
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {isPending && canApproveReject && (
                  <>
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={isApproving || isRejecting}
                      className="px-6 py-3 lg:px-8 lg:py-4 rounded-md text-base lg:text-lg xl:text-xl font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Setujui Pendaftaran
                    </button>
                    <button
                      onClick={() => openRejectModal()}
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
          <div className="px-6 py-6 lg:px-8 lg:py-8">
            <div className="space-y-0 divide-y divide-gray-100">
              <DataRow label="Nama Lengkap" value={participant.fullName} />
              <DataRow label="Asal Gereja" value={participant.churchName} />
              <DataRow label="Ministry" value={participant.ministry} />
              <DataRow label="Gender" value={participant.gender} />
              <DataRow label="Email" value={participant.email} />
              <DataRow label="No. Telp" value={participant.phoneNumber} />
              <DataRow label="Catatan Khusus" value={participant.specialNotes ? <span className="whitespace-pre-wrap">{participant.specialNotes}</span> : '-'} />
            </div>
            {participant.status === 'Daftar ulang' && participant.rejectReason && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm font-medium text-red-700 mb-2">Alasan penolakan pendaftaran</p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap bg-red-50 rounded-lg p-4">{participant.rejectReason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Invoice - tampil ketika bukti pembayaran sudah dikirim dan status Pending atau Terdaftar */}
        {participant.paymentProofUrl && (participant.status === 'Pending' || participant.status === 'Terdaftar') && (participant.baseAmount != null || participant.totalAmount != null) && (
          <div className="bg-white rounded-lg shadow-md p-6 lg:p-8 xl:p-10 mb-6 lg:mb-8">
            <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-6">
              Invoice
            </h2>
            <div className="space-y-3">
              {participant.baseAmount != null && (
                <>
                  <div>
                    <div className="flex justify-between text-sm lg:text-base">
                      <span className="text-gray-700">
                        Biaya pendaftaran ({participant.ministry || '-'}) a/n {participant.fullName}
                      </span>
                      <span className="text-gray-900">
                        Rp {formatRupiah(
                          participant.baseAmount -
                            ((participant.children?.length ?? 0) * CHILD_FEE)
                        )}
                      </span>
                    </div>
                    {participant.shirtSize && (
                      <p className="text-sm lg:text-base text-gray-700 mt-0.5">Size baju: {participant.shirtSize}</p>
                    )}
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
              <div className="flex justify-between text-sm lg:text-base">
                <span className="text-gray-700">Kode unik</span>
                <span className="text-gray-900 font-mono">{participant.uniqueCode ?? '-'}</span>
              </div>
              {participant.totalAmount != null && (
                <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between items-center text-base lg:text-lg font-bold">
                  <span className="text-gray-900">Total transfer</span>
                  <span className="flex items-center gap-1">
                    Rp {formatRupiah(participant.totalAmount)}
                    <CopyButton text={String(participant.totalAmount)} label="nominal transfer" />
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Bukti Pembayaran */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-6 lg:px-8 lg:py-8 xl:px-10 xl:py-10">
            <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-6">
              Bukti Pembayaran
            </h2>
            {participant.paymentProofUrl ? (
              <div>
                <button
                  type="button"
                  onClick={() => setShowPaymentProofModal(true)}
                  className="inline-flex items-center px-5 py-3 lg:px-6 lg:py-4 border border-gray-300 rounded-md shadow-sm text-base lg:text-lg font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  <svg className="w-6 h-6 lg:w-7 lg:h-7 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Lihat Bukti Pembayaran
                </button>
                <p className="mt-1 text-sm text-gray-500">Klik untuk memperbesar</p>
              </div>
            ) : (
              <p className="text-base lg:text-lg xl:text-xl text-gray-500">Tidak ada bukti pembayaran</p>
            )}
          </div>
        </div>

        {/* Modal Bukti Pembayaran - popup gambar seperti size chart */}
        {showPaymentProofModal && participant.paymentProofUrl && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowPaymentProofModal(false)}
              aria-hidden
            />
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowPaymentProofModal(false)}
            >
              <div className="relative max-h-[90vh] max-w-[95vw]">
                <button
                  type="button"
                  onClick={() => setShowPaymentProofModal(false)}
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
                  <img
                    src={getPaymentProofFullUrl(participant.paymentProofUrl) ?? ''}
                    alt="Bukti pembayaran"
                    className="w-full h-auto object-contain max-h-[85vh]"
                  />
                </div>
              </div>
            </div>
          </>
        )}

      <ParticipantDetailModals
        showConfirmModal={showConfirmModal}
        showRejectModal={showRejectModal}
        showCheckInModal={showCheckInModal}
        participant={participant}
        isApproving={isApproving}
        isRejecting={isRejecting}
        isCheckIn={isCheckIn}
        rejectReason={rejectReason}
        rejectReasonError={rejectReasonError}
        onCloseConfirm={() => setShowConfirmModal(false)}
        onCloseReject={() => setShowRejectModal(false)}
        onCloseCheckIn={() => setShowCheckInModal(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        onCheckIn={handleCheckIn}
        onRejectReasonChange={(v) => { setRejectReason(v); setRejectReasonError(null); }}
      />
    </div>
  );
}
