'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { apiClient, ParticipantDetailResponse } from '@/lib/api-client';

export function ParticipantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const registrationId = params.id as string;
  
  const [participant, setParticipant] = useState<ParticipantDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
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
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyetujui pendaftaran');
    } finally {
      setIsApproving(false);
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

  const canApprove = participant?.status === 'Pending';
  const isDisabled = participant?.status === 'Belum terdaftar' || participant?.status === 'Terdaftar';

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

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900">
                  Data Diri Peserta
                </h2>
                <p className="mt-2 text-base lg:text-lg xl:text-xl text-gray-500">
                  Status: <span className={`font-medium ${getStatusColor(participant.status)}`}>
                    {participant.status}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={isDisabled}
                className={`px-6 py-3 lg:px-8 lg:py-4 rounded-md text-base lg:text-lg xl:text-xl font-medium transition-colors ${
                  canApprove
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Setujui Pendaftaran
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10 space-y-6 lg:space-y-8">
            {/* Nama */}
            <div>
              <label className="block text-base lg:text-lg xl:text-xl font-medium text-gray-700 mb-3">
                Nama Lengkap
              </label>
              <p className="text-base lg:text-lg xl:text-xl text-gray-900">{participant.fullName}</p>
            </div>

            {/* Asal Gereja */}
            <div>
              <label className="block text-base lg:text-lg xl:text-xl font-medium text-gray-700 mb-3">
                Asal Gereja
              </label>
              <p className="text-base lg:text-lg xl:text-xl text-gray-900">{participant.churchName}</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-base lg:text-lg xl:text-xl font-medium text-gray-700 mb-3">
                Email
              </label>
              <p className="text-base lg:text-lg xl:text-xl text-gray-900">{participant.email}</p>
            </div>

            {/* No. Telp */}
            <div>
              <label className="block text-base lg:text-lg xl:text-xl font-medium text-gray-700 mb-3">
                No. Telp
              </label>
              <p className="text-base lg:text-lg xl:text-xl text-gray-900">{participant.phoneNumber || '-'}</p>
            </div>

            {/* Catatan Khusus */}
            <div>
              <label className="block text-base lg:text-lg xl:text-xl font-medium text-gray-700 mb-3">
                Catatan Khusus
              </label>
              <p className="text-base lg:text-lg xl:text-xl text-gray-900 whitespace-pre-wrap">
                {participant.specialNotes || '-'}
              </p>
            </div>

            {/* Bukti Pembayaran */}
            <div>
              <label className="block text-base lg:text-lg xl:text-xl font-medium text-gray-700 mb-3">
                Bukti Pembayaran
              </label>
              {participant.paymentProofUrl ? (
                <div className="mt-2">
                  <a
                    href={participant.paymentProofUrl}
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
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <>
          {/* Backdrop with blur - positioned behind modal */}
          <div 
            className="fixed inset-0 backdrop-blur-md z-40"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            onClick={() => !isApproving && setShowConfirmModal(false)}
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto pointer-events-none">
            {/* Modal */}
            <div 
              className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-50 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="p-6">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
                Konfirmasi Persetujuan
              </h3>
              <p className="text-sm lg:text-base text-gray-600 mb-6">
                Apakah Anda yakin ingin menyetujui pendaftaran peserta ini? Status akan berubah menjadi "Terdaftar".
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isApproving}
                  className="px-4 py-2 text-sm lg:text-base font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="px-4 py-2 text-sm lg:text-base font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isApproving ? 'Memproses...' : 'Setujui'}
                </button>
              </div>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
