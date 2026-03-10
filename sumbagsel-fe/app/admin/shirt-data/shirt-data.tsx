'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient, ShirtDataResponse } from '@/lib/api-client';
import { FEATURES } from '@/lib/features';
import { MAIN_CHURCH_OPTIONS, CHURCH_FILTER_OTHER, SIZE_OPTIONS } from '@/lib/admin-filter-constants';
const navActive = 'px-4 py-2 text-sm lg:text-base font-medium text-green-600 bg-green-50 rounded-md';
const navInactive = 'px-4 py-2 text-sm lg:text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors';

const selectClass = 'block w-full sm:w-auto min-w-[200px] rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-base lg:text-base px-4 py-3 bg-white appearance-none cursor-pointer';

export function ShirtDataPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState<ShirtDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [churchFilter, setChurchFilter] = useState<string>('');
  const [sizeFilter, setSizeFilter] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        await apiClient.getAdminMe();
        const result = await apiClient.getShirtData({
          church: churchFilter || undefined,
          size: sizeFilter || undefined,
        });
        setData(result);
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
  }, [router, churchFilter, sizeFilter]);

  const handleLogout = () => {
    apiClient.adminLogout();
    router.push('/admin');
  };

  const totalsBySizeAll = SIZE_OPTIONS.map((s) => ({
    size: s,
    count: data?.totalsBySize?.[s] ?? 0,
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto" />
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl xl:max-w-[95%] 2xl:max-w-[98%] mx-auto px-[10%]">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Dashboard Admin</h1>
              <button
                onClick={() => router.push('/admin/dashboard')}
                className={pathname === '/admin/dashboard' || pathname?.startsWith('/admin/participants') ? navActive : navInactive}
              >
                Data Konferensi
              </button>
              <button
                onClick={() => router.push('/admin/shirt-data')}
                className={pathname === '/admin/shirt-data' ? navActive : navInactive}
              >
                Data Baju
              </button>
              <button
                onClick={() => router.push('/admin/children')}
                className={pathname === '/admin/children' ? navActive : navInactive}
              >
                Daftar Anak
              </button>
              {FEATURES.arrivalSchedule && (
                <button
                  onClick={() => router.push('/admin/arrival-schedules')}
                  className={pathname === '/admin/arrival-schedules' ? navActive : navInactive}
                >
                  Arrival Schedules
                </button>
              )}
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm lg:text-base font-medium text-gray-700 hover:text-gray-900"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl xl:max-w-[95%] 2xl:max-w-[98%] mx-auto px-[10%] py-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-6 lg:py-10 xl:px-8 border-b border-gray-200">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900">Data Baju</h2>
                <p className="mt-2 text-base lg:text-lg xl:text-xl text-gray-500">
                  Hanya peserta dengan status Terdaftar. Total: {data?.rows.length ?? 0} peserta
                </p>
              </div>

              {/* Total per size - tampilkan semua size (XS, S, M, L, XL, XXL, XXXL) */}
              <div className="flex flex-wrap gap-4">
                {totalsBySizeAll.map(({ size, count }) => (
                  <div
                    key={size}
                    className="px-4 py-2 bg-gray-100 rounded-lg font-medium text-gray-900"
                  >
                    {size}: {count}
                  </div>
                ))}
              </div>

              {/* Filters - styling sama dengan Data Konferensi */}
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
                  <label htmlFor="sizeFilter" className="block text-sm lg:text-base font-medium text-gray-700 mb-2">
                    Size Baju
                  </label>
                  <select
                    id="sizeFilter"
                    value={sizeFilter}
                    onChange={(e) => setSizeFilter(e.target.value)}
                    className={selectClass}
                    style={{ fontSize: '16px', WebkitAppearance: 'none', MozAppearance: 'none' }}
                  >
                    <option value="" style={{ fontSize: '16px', padding: '12px' }}>Semua</option>
                    {SIZE_OPTIONS.map((s) => (
                      <option key={s} value={s} style={{ fontSize: '16px', padding: '12px' }}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full divide-y divide-gray-200 lg:table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-4 lg:px-5 lg:py-4 xl:px-6 xl:py-5 text-left text-sm lg:text-base xl:text-lg font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap lg:w-[18%]">
                    Nama
                  </th>
                  <th className="px-4 py-4 lg:px-5 lg:py-4 xl:px-6 xl:py-5 text-left text-sm lg:text-base xl:text-lg font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap lg:w-[18%]">
                    Asal Gereja
                  </th>
                  <th className="px-4 py-4 lg:px-5 lg:py-4 xl:px-6 xl:py-5 text-left text-sm lg:text-base xl:text-lg font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap lg:w-[10%]">
                    Size Baju
                  </th>
                  <th className="px-4 py-4 lg:px-5 lg:py-4 xl:px-6 xl:py-5 text-left text-sm lg:text-base xl:text-lg font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap lg:w-[15%]">
                    No. Telp
                  </th>
                  <th className="px-4 py-4 lg:px-5 lg:py-4 xl:px-6 xl:py-5 text-left text-sm lg:text-base xl:text-lg font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap lg:w-[25%]">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!data?.rows.length ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 lg:py-16 text-center text-base lg:text-lg xl:text-xl text-gray-500">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  data.rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 lg:px-5 lg:py-4 xl:px-6 xl:py-5 whitespace-nowrap text-base lg:text-lg xl:text-xl text-gray-900 overflow-hidden text-ellipsis">
                        {row.fullName}
                      </td>
                      <td className="px-4 py-4 lg:px-5 lg:py-4 xl:px-6 xl:py-5 whitespace-nowrap text-base lg:text-lg xl:text-xl text-gray-900 overflow-hidden text-ellipsis">
                        {row.churchName}
                      </td>
                      <td className="px-4 py-4 lg:px-5 lg:py-4 xl:px-6 xl:py-5 whitespace-nowrap text-base lg:text-lg xl:text-xl text-gray-900 overflow-hidden text-ellipsis">
                        {row.shirtSize}
                      </td>
                      <td className="px-4 py-4 lg:px-5 lg:py-4 xl:px-6 xl:py-5 whitespace-nowrap text-base lg:text-lg xl:text-xl text-gray-500 overflow-hidden text-ellipsis">
                        {row.phoneNumber || '-'}
                      </td>
                      <td className="px-4 py-4 lg:px-5 lg:py-4 xl:px-6 xl:py-5 whitespace-nowrap text-base lg:text-lg xl:text-xl text-gray-500 overflow-hidden text-ellipsis">
                        {row.email}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
