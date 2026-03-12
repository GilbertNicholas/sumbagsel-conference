'use client';

type ParticipantDetailModalsProps = {
  showConfirmModal: boolean;
  showRejectModal: boolean;
  showCheckInModal: boolean;
  participant: { fullName: string } | null;
  isApproving: boolean;
  isRejecting: boolean;
  isCheckIn: boolean;
  rejectReason: string;
  rejectReasonError: string | null;
  onCloseConfirm: () => void;
  onCloseReject: () => void;
  onCloseCheckIn: () => void;
  onApprove: () => void;
  onReject: () => void;
  onCheckIn: () => void;
  onRejectReasonChange: (v: string) => void;
};

export function ParticipantDetailModals(props: ParticipantDetailModalsProps) {
  const {
    showConfirmModal,
    showRejectModal,
    showCheckInModal,
    participant,
    isApproving,
    isRejecting,
    isCheckIn,
    rejectReason,
    rejectReasonError,
    onCloseConfirm,
    onCloseReject,
    onCloseCheckIn,
    onApprove,
    onReject,
    onCheckIn,
    onRejectReasonChange,
  } = props;

  return (
    <>
      {showConfirmModal && (
        <>
          <div
            className="fixed inset-0 backdrop-blur-md z-40"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            onClick={() => !isApproving && onCloseConfirm()}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto pointer-events-none">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-50 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">Konfirmasi Persetujuan</h3>
                <p className="text-sm lg:text-base text-gray-600 mb-6">
                  Apakah Anda yakin ingin menyetujui pendaftaran peserta ini? Status akan berubah menjadi &quot;Terdaftar&quot;.
                </p>
                <div className="flex justify-end gap-3">
                  <button onClick={onCloseConfirm} disabled={isApproving} className="px-4 py-2 text-sm lg:text-base font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50">Batal</button>
                  <button onClick={onApprove} disabled={isApproving} className="px-4 py-2 text-sm lg:text-base font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50">{isApproving ? 'Memproses...' : 'Setujui'}</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {showRejectModal && participant && (
        <>
          <div
            className="fixed inset-0 backdrop-blur-md z-40"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            onClick={() => !isRejecting && onCloseReject()}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto pointer-events-none">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-50 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">Konfirmasi Penolakan</h3>
                <p className="text-sm lg:text-base text-gray-600 mb-4">
                  Anda yakin menolak pendaftaran peserta <strong>{participant.fullName}</strong>? Peserta akan diminta membuat pengajuan pendaftaran kembali.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alasan menolak pendaftaran:</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => {
                      onRejectReasonChange(e.target.value);
                    }}
                    placeholder="Masukkan alasan penolakan..."
                    rows={4}
                    className={`block w-full rounded-lg border px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-20 ${rejectReasonError ? 'border-red-500' : 'border-gray-300'}`}
                    disabled={isRejecting}
                  />
                  {rejectReasonError && (
                    <p className="mt-1 text-sm text-red-600">{rejectReasonError}</p>
                  )}
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={onCloseReject} disabled={isRejecting} className="px-4 py-2 text-sm lg:text-base font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50">Batal</button>
                  <button onClick={onReject} disabled={isRejecting} className="px-4 py-2 text-sm lg:text-base font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50">{isRejecting ? 'Memproses...' : 'Tolak pendaftaran'}</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {showCheckInModal && (
        <>
          <div
            className="fixed inset-0 backdrop-blur-md z-40"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            onClick={() => !isCheckIn && onCloseCheckIn()}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto pointer-events-none">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-50 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">Konfirmasi Check-in</h3>
                <p className="text-sm lg:text-base text-gray-600 mb-6">
                  Apakah Anda yakin ingin melakukan check-in peserta ini? Tindakan ini menandakan peserta telah hadir di lokasi.
                </p>
                <div className="flex justify-end gap-3">
                  <button onClick={onCloseCheckIn} disabled={isCheckIn} className="px-4 py-2 text-sm lg:text-base font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50">Batal</button>
                  <button onClick={onCheckIn} disabled={isCheckIn} className="px-4 py-2 text-sm lg:text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50">{isCheckIn ? 'Memproses...' : 'Check-in'}</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
