'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient, ParticipantDetailResponse } from '@/lib/api-client';
import { formatDateOfBirthDisplay } from '@/lib/utils';

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-3 border-b border-gray-100 last:border-0">
      <span className="font-medium text-gray-700 min-w-[220px] shrink-0 text-base lg:text-lg">{label}</span>
      <span className="text-gray-500 shrink-0">:</span>
      <span className="text-gray-900 text-base lg:text-lg">{value ?? '-'}</span>
    </div>
  );
}

export function RegistrationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const registrationId = params.id as string;

  const [participant, setParticipant] = useState<ParticipantDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [isCheckIn, setIsCheckIn] = useState(false);
  const [checkingInChildId, setCheckingInChildId] = useState<string | null>(null);
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

  const handleCheckInParticipant = async () => {
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

  const handleCheckInChild = async (childId: string) => {
    try {
      setCheckingInChildId(childId);
      setError(null);
      const updated = await apiClient.checkInChild(childId);
      setParticipant(updated);
      setSuccess('Anak berhasil check-in');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal melakukan check-in anak');
    } finally {
      setCheckingInChildId(null);
    }
  };

  const hasCheckedIn = !!participant?.checkedInAt;
  const canCheckIn = participant?.status === 'Terdaftar' && !hasCheckedIn;
  const children = participant?.children ?? [];

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
            onClick={() => router.push('/admin/registrations')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Kembali ke Registrasi Peserta
          </button>
        </div>
      </div>
    );
  }

  if (!participant || participant.status !== 'Terdaftar') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Peserta tidak ditemukan atau belum berstatus Terdaftar</p>
          <button
            onClick={() => router.push('/admin/registrations')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Kembali ke Registrasi Peserta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl xl:max-w-6xl mx-auto">
      <button
        onClick={() => router.push('/admin/registrations')}
        className="mb-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-gray-300 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Registrasi Peserta
      </button>

      {success && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
          <p className="text-sm lg:text-base font-medium text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm lg:text-base font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* Section 1: Profile Peserta */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-6 lg:px-8 lg:py-8 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900">
                Profile Peserta
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {hasCheckedIn && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Sudah check-in
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {canCheckIn && (
                <button
                  onClick={() => setShowCheckInModal(true)}
                  disabled={isCheckIn}
                  className="px-6 py-3 lg:px-8 lg:py-4 rounded-md text-base lg:text-lg xl:text-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Check-in Peserta
                </button>
              )}
              {hasCheckedIn && (
                <span className="px-6 py-3 lg:px-8 lg:py-4 rounded-md text-base lg:text-lg xl:text-xl font-medium bg-gray-200 text-gray-600">
                  Sudah check-in
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="px-6 py-6 lg:px-8 lg:py-8">
          {participant.registrationId && (
            <div className="mb-6 pb-6 border-b border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-2">Registration ID</p>
              <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-green-600 tracking-wider">
                {participant.registrationId}
              </p>
            </div>
          )}
          <div className="space-y-0 divide-y divide-gray-100">
            <DataRow label="Nama Lengkap" value={participant.fullName} />
            <DataRow label="Asal Gereja" value={participant.churchName} />
            <DataRow label="Ministry" value={participant.ministry} />
            <DataRow label="Gender" value={participant.gender} />
            <DataRow label="Tanggal Lahir" value={formatDateOfBirthDisplay(participant.dateOfBirth ?? null)} />
            <DataRow label="Email" value={participant.email} />
            <DataRow label="No. Telp" value={participant.phoneNumber} />
            <DataRow label="Size Baju" value={(participant.shirtSizes ?? (participant.shirtSize ? [participant.shirtSize] : [])).length > 0 ? (participant.shirtSizes ?? [participant.shirtSize!]).join(', ') : '-'} />
            <DataRow label="Catatan Khusus" value={participant.specialNotes ? <span className="whitespace-pre-wrap">{participant.specialNotes}</span> : '-'} />
          </div>
        </div>
      </div>

      {/* Section 2: Profile Anak */}
      {children.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-6 lg:px-8 lg:py-8">
            <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-6">
              Profile Anak (terdaftar atas nama peserta)
            </h2>
            <div className="space-y-4">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-base lg:text-lg">{child.name}</p>
                    <p className="text-sm text-gray-500">Usia: {child.age} tahun</p>
                    <p className="text-sm mt-0.5">
                      Konsumsi:{' '}
                      <span className={`font-medium ${(child.needsConsumption ?? true) ? 'text-green-600' : 'text-red-600'}`}>
                        {(child.needsConsumption ?? true) ? 'Ya' : 'Tidak'}
                      </span>
                    </p>
                    {child.checkedInAt && (
                      <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Sudah check-in
                      </span>
                    )}
                  </div>
                  <div>
                    {child.checkedInAt ? (
                      <span className="px-4 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-600">
                        Sudah check-in
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCheckInChild(child.id)}
                        disabled={!!checkingInChildId}
                        className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {checkingInChildId === child.id ? 'Memproses...' : 'Check-in Anak'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Check-in Confirmation Modal */}
      {showCheckInModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => !isCheckIn && setShowCheckInModal(false)}
            aria-hidden
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Konfirmasi Check-in</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin melakukan check-in untuk {participant.fullName}?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => !isCheckIn && setShowCheckInModal(false)}
                  disabled={isCheckIn}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleCheckInParticipant}
                  disabled={isCheckIn}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCheckIn ? 'Memproses...' : 'Check-in'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
