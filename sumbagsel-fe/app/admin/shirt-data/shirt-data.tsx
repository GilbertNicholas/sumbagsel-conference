'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ShirtDataResponse } from '@/lib/api-client';
import { MAIN_CHURCH_OPTIONS, CHURCH_FILTER_OTHER, SIZE_OPTIONS } from '@/lib/admin-filter-constants';
import { adminTableTh, adminTableTd, adminTableTdMuted, adminTableEmpty, adminTableWrapper } from '@/lib/admin-table-styles';

const selectClass = 'block w-full sm:w-auto min-w-[200px] rounded-md border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-base lg:text-base px-4 py-3 bg-white appearance-none cursor-pointer';

export function ShirtDataPage() {
  const router = useRouter();
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

  const totalsBySizeAll = SIZE_OPTIONS.map((s) => ({
    size: s,
    count: data?.totalsBySize?.[s] ?? 0,
  }));

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

          <div className={adminTableWrapper}>
            <table className="w-full min-w-[560px] divide-y divide-gray-200 lg:table-fixed lg:min-w-0">
              <thead className="bg-gray-50">
                <tr>
                  <th className={`${adminTableTh} lg:w-[18%]`}>Nama</th>
                  <th className={`${adminTableTh} lg:w-[18%]`}>Asal Gereja</th>
                  <th className={`${adminTableTh} lg:w-[10%]`}>Size Baju</th>
                  <th className={`${adminTableTh} lg:w-[15%]`}>No. Telp</th>
                  <th className={`${adminTableTh} lg:w-[25%]`}>Email</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!data?.rows.length ? (
                  <tr>
                    <td colSpan={5} className={adminTableEmpty}>Tidak ada data</td>
                  </tr>
                ) : (
                  data.rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className={adminTableTd}>{row.fullName}</td>
                      <td className={adminTableTd}>{row.churchName}</td>
                      <td className={adminTableTd}>{row.shirtSize}</td>
                      <td className={adminTableTdMuted}>{row.phoneNumber || '-'}</td>
                      <td className={adminTableTdMuted}>{row.email}</td>
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
