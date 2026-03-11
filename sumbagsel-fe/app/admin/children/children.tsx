'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ChildRow, ChildrenResponse, ParticipantDetailResponse } from '@/lib/api-client';
import { MAIN_CHURCH_OPTIONS, CHURCH_FILTER_OTHER, CHILD_AGE_OPTIONS } from '@/lib/admin-filter-constants';
import { adminTableTh, adminTableTd, adminTableTdMuted, adminTableEmpty, adminTableWrapper } from '@/lib/admin-table-styles';


const selectClass = 'block w-full sm:w-auto min-w-[200px] rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-base lg:text-base px-4 py-3 bg-white appearance-none cursor-pointer';

export function ChildrenPage() {
  const router = useRouter();
  const [data, setData] = useState<ChildrenResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [churchFilter, setChurchFilter] = useState<string>('');
  const [ageFilter, setAgeFilter] = useState<string>('');
  const [checkInFilter, setCheckInFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [detailChild, setDetailChild] = useState<ChildRow | null>(null);
  const [participantDetail, setParticipantDetail] = useState<ParticipantDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isCheckInLoading, setIsCheckInLoading] = useState(false);
  const filterLoadRef = useRef(false);

  const loadData = async () => {
    try {
      const result = await apiClient.getChildren({
        church: churchFilter || undefined,
        age: ageFilter || undefined,
        checkInStatus: checkInFilter || undefined,
        search: searchQuery.trim() || undefined,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    }
  };

  useEffect(() => {
    async function init() {
      try {
        await apiClient.getAdminMe();
        await loadData();
      } catch (err) {
        if (err instanceof Error && err.message.includes('No admin token')) {
          router.push('/admin');
          return;
        }
        setError(err instanceof Error ? err.message : 'Gagal memuat data');
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [router]);

  useEffect(() => {
    if (!filterLoadRef.current) {
      filterLoadRef.current = true;
      return;
    }
    const t = setTimeout(() => loadData(), searchQuery ? 400 : 0);
    return () => clearTimeout(t);
  }, [churchFilter, ageFilter, checkInFilter, searchQuery]);

  const handleLogout = () => {
    apiClient.adminLogout();
    router.push('/admin');
  };

  const openDetail = async (child: ChildRow) => {
    setDetailChild(child);
    setParticipantDetail(null);
    setIsLoadingDetail(true);
    try {
      const detail = await apiClient.getParticipantById(child.registrationId);
      setParticipantDetail(detail);
    } catch {
      setParticipantDetail(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCheckIn = async () => {
    if (!detailChild) return;
    setIsCheckInLoading(true);
    try {
      const updated = await apiClient.checkInParticipant(detailChild.registrationId);
      setParticipantDetail(updated);
      await loadData();
      if (detailChild) {
        setDetailChild((prev) =>
          prev ? { ...prev, checkedInAt: updated.checkedInAt ?? null } : null
        );
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal check-in');
    } finally {
      setIsCheckInLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto" />
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
      <div className="max-w-7xl xl:max-w-[95%] 2xl:max-w-[98%] mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-6 lg:py-10 xl:px-8 border-b border-gray-200">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900">Daftar Anak</h2>
                <p className="mt-2 text-base lg:text-lg xl:text-xl text-gray-500">
                  Total: {data?.total ?? 0} anak (hanya dari peserta Terdaftar)
                </p>
              </div>

              {/* Filters & Search - styling sama dengan Data Konferensi */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="w-full sm:w-auto">
                  <label htmlFor="churchFilter" className="block text-sm lg:text-base font-medium text-gray-700 mb-2">
                    Asal Gereja
                  </label>
                  <select
                    id="churchFilter"
                    value={churchFilter}
                    onChange={(e) => setChurchFilter(e.target.value)}
                    className={selectClass}
                    style={{ fontSize: '16px', WebkitAppearance: 'none', MozAppearance: 'none' }}
                  >
                    <option value="" style={{ fontSize: '16px', padding: '12px' }}>Semua</option>
                    {MAIN_CHURCH_OPTIONS.map((c) => (
                      <option key={c} value={c} style={{ fontSize: '16px', padding: '12px' }}>{c}</option>
                    ))}
                    <option value={CHURCH_FILTER_OTHER} style={{ fontSize: '16px', padding: '12px' }}>Lainnya</option>
                  </select>
                </div>
                <div className="w-full sm:w-auto">
                  <label htmlFor="ageFilter" className="block text-sm lg:text-base font-medium text-gray-700 mb-2">
                    Usia
                  </label>
                  <select
                    id="ageFilter"
                    value={ageFilter}
                    onChange={(e) => setAgeFilter(e.target.value)}
                    className={selectClass}
                    style={{ fontSize: '16px', WebkitAppearance: 'none', MozAppearance: 'none' }}
                  >
                    <option value="" style={{ fontSize: '16px', padding: '12px' }}>Semua</option>
                    {CHILD_AGE_OPTIONS.map((a) => (
                      <option key={a} value={String(a)} style={{ fontSize: '16px', padding: '12px' }}>{a} tahun</option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-auto">
                  <label htmlFor="checkInFilter" className="block text-sm lg:text-base font-medium text-gray-700 mb-2">
                    Check-in
                  </label>
                  <select
                    id="checkInFilter"
                    value={checkInFilter}
                    onChange={(e) => setCheckInFilter(e.target.value)}
                    className={selectClass}
                    style={{ fontSize: '16px', WebkitAppearance: 'none', MozAppearance: 'none' }}
                  >
                    <option value="" style={{ fontSize: '16px', padding: '12px' }}>Semua</option>
                    <option value="checked-in" style={{ fontSize: '16px', padding: '12px' }}>Sudah check-in</option>
                    <option value="not-checked-in" style={{ fontSize: '16px', padding: '12px' }}>Belum check-in</option>
                  </select>
                </div>
              </div>

              {/* Search Bar */}
              <div className="w-full">
                <label htmlFor="search" className="block text-sm lg:text-base font-medium text-gray-700 mb-2">
                  Cari (nama anak atau atas nama)
                </label>
                <div className="relative">
                  <input
                    id="search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama anak atau nama pendaftar..."
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-base lg:text-base px-4 py-3 pl-10"
                    style={{ fontSize: '16px' }}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={adminTableWrapper}>
            <table className="w-full min-w-[560px] divide-y divide-gray-200 lg:table-fixed lg:min-w-0">
              <thead className="bg-gray-50">
                <tr>
                  <th className={`${adminTableTh} lg:w-[18%]`}>Nama Anak</th>
                  <th className={`${adminTableTh} lg:w-[18%]`}>Asal Gereja</th>
                  <th className={`${adminTableTh} lg:w-[8%]`}>Usia</th>
                  <th className={`${adminTableTh} lg:w-[18%]`}>Atas Nama</th>
                  <th className={`${adminTableTh} lg:w-[12%]`}>Check-in</th>
                  <th className={`${adminTableTh} lg:w-[15%]`}>Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!data?.rows.length ? (
                  <tr>
                    <td colSpan={6} className={adminTableEmpty}>Tidak ada data</td>
                  </tr>
                ) : (
                  data.rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className={adminTableTd}>{row.childName}</td>
                      <td className={adminTableTd}>{row.churchName}</td>
                      <td className={adminTableTd}>{row.age} tahun</td>
                      <td className={adminTableTd}>{row.parentName}</td>
                      <td className={adminTableTd}>
                        {row.checkedInAt ? (
                          <span className="font-medium text-green-600">✓ Sudah</span>
                        ) : (
                          <span className="text-gray-500">Belum</span>
                        )}
                      </td>
                      <td className={`${adminTableTd} font-medium`}>
                        <button
                          onClick={() => openDetail(row)}
                          className="px-3 py-2 lg:px-4 lg:py-2 border-2 border-red-600 text-red-600 rounded-md transition-colors font-medium whitespace-nowrap text-sm"
                        >
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Detail Modal */}
      {detailChild && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          aria-modal="true"
          role="dialog"
        >
          <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail Anak</h3>

            <div className="space-y-2 mb-6">
              <p><span className="font-medium text-gray-700">Nama:</span> {detailChild.childName}</p>
              <p><span className="font-medium text-gray-700">Usia:</span> {detailChild.age} tahun</p>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Data Diri Atas Nama</h4>
              {isLoadingDetail ? (
                <p className="text-gray-500">Memuat...</p>
              ) : participantDetail ? (
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium text-gray-700">Nama:</span> {participantDetail.fullName}</p>
                  <p><span className="font-medium text-gray-700">Asal Gereja:</span> {participantDetail.churchName}</p>
                  <p><span className="font-medium text-gray-700">No. Telp:</span> {participantDetail.phoneNumber || '-'}</p>
                  <p><span className="font-medium text-gray-700">Email:</span> {participantDetail.email}</p>
                  {participantDetail.checkedInAt && (
                    <p className="text-green-600 font-medium">✓ Sudah check-in</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Gagal memuat data</p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setDetailChild(null);
                  setParticipantDetail(null);
                }}
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Tutup
              </button>
              {participantDetail &&
                participantDetail.status === 'Terdaftar' &&
                !participantDetail.checkedInAt && (
                  <button
                    type="button"
                    onClick={handleCheckIn}
                    disabled={isCheckInLoading}
                    className="rounded-md px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {isCheckInLoading ? 'Memproses...' : 'Check In'}
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
      </div>
  );
}
