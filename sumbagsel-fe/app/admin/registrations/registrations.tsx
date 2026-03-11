'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ParticipantResponse } from '@/lib/api-client';
import { MAIN_CHURCH_OPTIONS, CHURCH_FILTER_OTHER } from '@/lib/admin-filter-constants';
import { adminTableTh, adminTableTd, adminTableTdMuted, adminTableEmpty, adminTableWrapper } from '@/lib/admin-table-styles';

const selectClass = 'block w-full sm:w-auto min-w-[130px] rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm px-3 py-2 bg-white appearance-none cursor-pointer';

export function RegistrationsPage() {
  const router = useRouter();
  const [participants, setParticipants] = useState<ParticipantResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [churchFilter, setChurchFilter] = useState<string>('');
  const [checkInFilter, setCheckInFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        await apiClient.getAdminMe();
        const data = await apiClient.getAllParticipants();
        setParticipants(data);
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

    loadData();
  }, [router]);

  const registeredOnly = useMemo(() => participants.filter((p) => p.status === 'Terdaftar'), [participants]);

  const filteredParticipants = useMemo(() => {
    let result = [...registeredOnly];

    if (churchFilter) {
      if (churchFilter === CHURCH_FILTER_OTHER) {
        result = result.filter((p) => !MAIN_CHURCH_OPTIONS.some((opt) => opt === (p.churchName || '')));
      } else {
        result = result.filter((p) => p.churchName === churchFilter);
      }
    }

    if (checkInFilter === 'checked-in') {
      result = result.filter((p) => !!p.checkedInAt);
    } else if (checkInFilter === 'not-checked-in') {
      result = result.filter((p) => !p.checkedInAt);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const fullName = p.fullName?.toLowerCase() || '';
        const phoneNumber = p.phoneNumber?.toLowerCase() || '';
        const email = p.email?.toLowerCase() || '';
        return fullName.includes(query) || phoneNumber.includes(query) || email.includes(query);
      });
    }

    return result;
  }, [registeredOnly, churchFilter, searchQuery]);

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
        <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-6 lg:py-8 xl:px-8 border-b border-gray-200">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg lg:text-xl xl:text-2xl font-semibold text-gray-900">
                Registrasi Peserta
              </h2>
              <p className="mt-1 text-sm lg:text-base text-gray-500">
                Total: {filteredParticipants.length} dari {registeredOnly.length} peserta (status Terdaftar)
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="w-full sm:w-auto">
                <label htmlFor="churchFilter" className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
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
                <label htmlFor="checkInFilter" className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
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

              <div className="w-full">
                <label htmlFor="search" className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
                  Cari
                </label>
                <div className="relative">
                  <input
                    id="search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari berdasarkan nama, no. telp, atau email..."
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm px-3 py-2 pl-9"
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
        </div>

        <div className={adminTableWrapper}>
          <table className="w-full min-w-[560px] divide-y divide-gray-200 lg:table-fixed lg:min-w-0">
            <thead className="bg-gray-50">
              <tr>
                <th className={`${adminTableTh} lg:w-[16%]`}>Nama</th>
                <th className={`${adminTableTh} lg:w-[16%]`}>Asal Gereja</th>
                <th className={`${adminTableTh} lg:w-[10%]`}>No. Telp</th>
                <th className={`${adminTableTh} lg:w-[16%]`}>Email</th>
                <th className={`${adminTableTh} lg:w-[8%]`}>Size Baju</th>
                <th className={`${adminTableTh} lg:w-[10%]`}>Check-in</th>
                <th className={`${adminTableTh} lg:w-[12%]`}>Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={7} className={adminTableEmpty}>
                    Tidak ada peserta yang sesuai filter
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className={adminTableTd}>{p.fullName}</td>
                    <td className={adminTableTd}>{p.churchName}</td>
                    <td className={adminTableTdMuted}>{p.phoneNumber || '-'}</td>
                    <td className={adminTableTdMuted}>{p.email}</td>
                    <td className={adminTableTdMuted}>{p.shirtSize || '-'}</td>
                    <td className={adminTableTd}>
                      {p.checkedInAt ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Sudah
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">Belum</span>
                      )}
                    </td>
                    <td className={adminTableTd}>
                      <button
                        onClick={() => router.push(`/admin/registrations/${p.id}`)}
                        className="px-2 py-1.5 lg:px-3 lg:py-2 border-2 border-red-600 text-red-600 rounded-md transition-colors font-medium whitespace-nowrap text-sm"
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
    </div>
  );
}
