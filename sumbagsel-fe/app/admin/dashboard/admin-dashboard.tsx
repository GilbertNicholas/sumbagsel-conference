'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ParticipantResponse } from '@/lib/api-client';
import { MAIN_CHURCH_OPTIONS, CHURCH_FILTER_OTHER, MINISTRY_OPTIONS, GENDER_OPTIONS } from '@/lib/admin-filter-constants';
import { adminTableTh, adminTableTd, adminTableTdMuted, adminTableEmpty, adminTableWrapper } from '@/lib/admin-table-styles';

type SortOption = 'none' | 'date-desc' | 'status';
type FilterOption = 'none' | 'Pending' | 'Terdaftar' | 'Belum terdaftar';
type CheckInFilterOption = 'none' | 'checked-in' | 'not-checked-in';

export function AdminDashboardPage() {
  const router = useRouter();
  const [participants, setParticipants] = useState<ParticipantResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [filterBy, setFilterBy] = useState<FilterOption>('none');
  const [checkInFilter, setCheckInFilter] = useState<CheckInFilterOption>('none');
  const [ministryFilter, setMinistryFilter] = useState<string>('');
  const [churchFilter, setChurchFilter] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        // Check if admin is authenticated
        await apiClient.getAdminMe();
        
        // Load participants
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

  const getStatusDisplay = (status: string) => {
    // Di tabel admin, tampilkan "Pending" saja, bukan "Menunggu verifikasi admin"
    return status;
  };

  // Filter, search, dan sort participants
  const filteredAndSortedParticipants = useMemo(() => {
    let result = [...participants];

    // Apply search filter (nama atau no telp)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const fullName = p.fullName?.toLowerCase() || '';
        const phoneNumber = p.phoneNumber?.toLowerCase() || '';
        return fullName.includes(query) || phoneNumber.includes(query);
      });
    }

    // Apply filter
    if (filterBy !== 'none') {
      result = result.filter((p) => p.status === filterBy);
    }

    // Apply ministry filter
    if (ministryFilter) {
      result = result.filter((p) => p.ministry === ministryFilter);
    }

    // Apply church/kota filter
    if (churchFilter) {
      if (churchFilter === CHURCH_FILTER_OTHER) {
        result = result.filter((p) => !MAIN_CHURCH_OPTIONS.some((opt) => opt === (p.churchName || '')));
      } else {
        result = result.filter((p) => p.churchName === churchFilter);
      }
    }

    // Apply gender filter
    if (genderFilter) {
      result = result.filter((p) => p.gender === genderFilter);
    }

    // Apply check-in filter
    if (checkInFilter === 'checked-in') {
      result = result.filter((p) => !!p.checkedInAt);
    } else if (checkInFilter === 'not-checked-in') {
      result = result.filter((p) => p.status === 'Terdaftar' && !p.checkedInAt);
    }

    // Apply sort
    if (sortBy === 'date-desc') {
      result.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Terbaru pertama
      });
    } else if (sortBy === 'status') {
      const statusOrder: Record<string, number> = {
        'Belum terdaftar': 1,
        'Pending': 2,
        'Terdaftar': 3,
        'Daftar ulang': 4,
      };
      result.sort((a, b) => {
        const orderA = statusOrder[a.status] || 999;
        const orderB = statusOrder[b.status] || 999;
        return orderA - orderB;
      });
    }

    return result;
  }, [participants, filterBy, checkInFilter, sortBy, searchQuery, ministryFilter, churchFilter, genderFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
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
                  Data Peserta Konferensi
                </h2>
                <p className="mt-1 text-sm lg:text-base text-gray-500">
                  Total: {filteredAndSortedParticipants.length} dari {participants.length} peserta
                </p>
              </div>
                
                {/* Filter and Sort Controls - flex-wrap agar tidak tembus di layar medium */}
                <div className="flex flex-wrap gap-3">
                {/* Filter Dropdown */}
                <div className="w-full sm:w-auto">
                  <label htmlFor="filter" className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
                    Filter
                  </label>
                  <select
                    id="filter"
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                    className="block w-full sm:w-auto min-w-[130px] rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm px-3 py-2 bg-white appearance-none cursor-pointer"
                    style={{
                      fontSize: '16px', // Prevent zoom on iOS
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                    }}
                  >
                    <option value="none" style={{ fontSize: '16px', padding: '12px' }}>Tidak ada</option>
                    <option value="Pending" style={{ fontSize: '16px', padding: '12px' }}>Status Pending</option>
                    <option value="Terdaftar" style={{ fontSize: '16px', padding: '12px' }}>Status Terdaftar</option>
                    <option value="Belum terdaftar" style={{ fontSize: '16px', padding: '12px' }}>Status Belum terdaftar</option>
                  </select>
                </div>

                {/* Ministry Filter */}
                <div className="w-full sm:w-auto">
                  <label htmlFor="ministryFilter" className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
                    Ministry
                  </label>
                  <select
                    id="ministryFilter"
                    value={ministryFilter}
                    onChange={(e) => setMinistryFilter(e.target.value)}
                    className="block w-full sm:w-auto min-w-[130px] rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm px-3 py-2 bg-white appearance-none cursor-pointer"
                    style={{
                      fontSize: '16px',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                    }}
                  >
                    <option value="" style={{ fontSize: '16px', padding: '12px' }}>Semua</option>
                    {MINISTRY_OPTIONS.map((m) => (
                      <option key={m} value={m} style={{ fontSize: '16px', padding: '12px' }}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Gender Filter */}
                <div className="w-full sm:w-auto">
                  <label htmlFor="genderFilter" className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    id="genderFilter"
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="block w-full sm:w-auto min-w-[130px] rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm px-3 py-2 bg-white appearance-none cursor-pointer"
                    style={{
                      fontSize: '16px',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                    }}
                  >
                    <option value="" style={{ fontSize: '16px', padding: '12px' }}>Semua</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g} style={{ fontSize: '16px', padding: '12px' }}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Kota/Gereja Filter */}
                <div className="w-full sm:w-auto">
                  <label htmlFor="churchFilter" className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
                    Kota / Gereja
                  </label>
                  <select
                    id="churchFilter"
                    value={churchFilter}
                    onChange={(e) => setChurchFilter(e.target.value)}
                    className="block w-full sm:w-auto min-w-[130px] rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm px-3 py-2 bg-white appearance-none cursor-pointer"
                    style={{
                      fontSize: '16px',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                    }}
                  >
                    <option value="" style={{ fontSize: '16px', padding: '12px' }}>Semua</option>
                    {MAIN_CHURCH_OPTIONS.map((c) => (
                      <option key={c} value={c} style={{ fontSize: '16px', padding: '12px' }}>{c}</option>
                    ))}
                    <option value={CHURCH_FILTER_OTHER} style={{ fontSize: '16px', padding: '12px' }}>Lainnya</option>
                  </select>
                </div>

                {/* Check-in Filter */}
                <div className="w-full sm:w-auto">
                  <label htmlFor="checkInFilter" className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
                    Check-in
                  </label>
                  <select
                    id="checkInFilter"
                    value={checkInFilter}
                    onChange={(e) => setCheckInFilter(e.target.value as CheckInFilterOption)}
                    className="block w-full sm:w-auto min-w-[130px] rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm px-3 py-2 bg-white appearance-none cursor-pointer"
                    style={{
                      fontSize: '16px',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                    }}
                  >
                    <option value="none" style={{ fontSize: '16px', padding: '12px' }}>Semua</option>
                    <option value="checked-in" style={{ fontSize: '16px', padding: '12px' }}>Sudah check-in</option>
                    <option value="not-checked-in" style={{ fontSize: '16px', padding: '12px' }}>Belum check-in</option>
                  </select>
                </div>

                {/* Sort Dropdown */}
                <div className="w-full sm:w-auto">
                  <label htmlFor="sort" className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
                    Urutkan
                  </label>
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="block w-full sm:w-auto min-w-[130px] rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm px-3 py-2 bg-white appearance-none cursor-pointer"
                    style={{
                      fontSize: '16px', // Prevent zoom on iOS
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                    }}
                  >
                    <option value="none" style={{ fontSize: '16px', padding: '12px' }}>Tidak ada</option>
                    <option value="date-desc" style={{ fontSize: '16px', padding: '12px' }}>Tanggal pendaftaran terbaru</option>
                    <option value="status" style={{ fontSize: '16px', padding: '12px' }}>Status</option>
                  </select>
                </div>
                </div>

              {/* Search Bar */}
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
                    placeholder="Cari berdasarkan nama atau no. telp..."
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm px-3 py-2 pl-9"
                    style={{
                      fontSize: '16px', // Prevent zoom on iOS
                    }}
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

          {/* Table - scroll horizontal di layar kecil */}
          <div className={adminTableWrapper}>
            <table className="w-full min-w-[560px] divide-y divide-gray-200 lg:table-fixed lg:min-w-0">
              <thead className="bg-gray-50">
                <tr>
                  <th className={`${adminTableTh} lg:w-[18%]`}>Nama</th>
                  <th className={`${adminTableTh} lg:w-[12%]`}>Asal Gereja</th>
                  <th className={`${adminTableTh} lg:w-[8%]`}>Gender</th>
                  <th className={`${adminTableTh} lg:w-[12%]`}>No. Telp</th>
                  <th className={`${adminTableTh} lg:w-[25%]`}>Email</th>
                  <th className={`${adminTableTh} lg:w-[15%]`}>Status</th>
                  <th className={`${adminTableTh} lg:w-[15%]`}>Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={adminTableEmpty}>
                      {participants.length === 0 ? 'Tidak ada data peserta' : 'Tidak ada peserta yang sesuai filter'}
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedParticipants.map((participant) => (
                    <tr key={participant.id} className="hover:bg-gray-50">
                      <td className={adminTableTd}>{participant.fullName}</td>
                      <td className={adminTableTd}>{participant.churchName}</td>
                      <td className={adminTableTdMuted}>{participant.gender || '-'}</td>
                      <td className={adminTableTdMuted}>{participant.phoneNumber || '-'}</td>
                      <td className={adminTableTdMuted}>{participant.email}</td>
                      <td className={adminTableTd}>
                        <div className="flex flex-col gap-0.5">
                          <span className={`font-medium ${getStatusColor(participant.status)}`}>
                            {getStatusDisplay(participant.status)}
                          </span>
                          {participant.status === 'Terdaftar' && participant.checkedInAt && (
                            <span className="text-green-600 font-medium">✓ Check-in</span>
                          )}
                        </div>
                      </td>
                      <td className={`${adminTableTd} font-medium`}>
                        <button
                          onClick={() => {
                            router.push(`/admin/participants/${participant.id}`);
                          }}
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
