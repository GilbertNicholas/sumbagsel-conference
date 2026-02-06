'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ArrivalScheduleGrouped, ArrivalScheduleSummary, ArrivalScheduleFilter, TransportationType } from '@/lib/api-client';

export function ArrivalScheduleManagementPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [arrivals, setArrivals] = useState<ArrivalScheduleGrouped[]>([]);
  const [summary, setSummary] = useState<ArrivalScheduleSummary>({ totalArrivals: 0, byAir: 0, bySea: 0 });
  const [filters, setFilters] = useState<ArrivalScheduleFilter>({
    search: '',
    transportationType: undefined,
    startDate: '',
    endDate: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Check if admin is authenticated
        await apiClient.getAdminMe();
        setIsAuthenticated(true);
      } catch (err) {
        if (err instanceof Error && err.message.includes('No admin token')) {
          router.push('/admin');
          return;
        }
        console.error('Failed to authenticate:', err);
      }
    }
    checkAuth();
  }, [router]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput || undefined }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    // Only load data if authenticated
    if (isAuthenticated) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.transportationType, filters.startDate, filters.endDate, filters.search, isAuthenticated]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Clean filters - remove empty strings and undefined values
      const cleanFilters: ArrivalScheduleFilter = {};
      if (filters.search && filters.search.trim()) {
        cleanFilters.search = filters.search.trim();
      }
      if (filters.transportationType) {
        cleanFilters.transportationType = filters.transportationType;
      }
      if (filters.startDate && filters.startDate.trim()) {
        cleanFilters.startDate = filters.startDate.trim();
      }
      if (filters.endDate && filters.endDate.trim()) {
        cleanFilters.endDate = filters.endDate.trim();
      }

      const [arrivalsData, summaryData] = await Promise.all([
        apiClient.getArrivalSchedules(Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined),
        apiClient.getArrivalScheduleSummary(Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined),
      ]);
      setArrivals(arrivalsData || []);
      setSummary(summaryData || { totalArrivals: 0, byAir: 0, bySea: 0 });
    } catch (error) {
      console.error('Failed to load arrival schedules:', error);
      setArrivals([]);
      setSummary({ totalArrivals: 0, byAir: 0, bySea: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await apiClient.exportArrivalSchedulesToCsv(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'arrival-schedules.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const formatTime = (time: string | null): string => {
    if (!time) return '-';
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours, 10);
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  };

  const formatDateInput = (date: string | null): string => {
    if (!date) return '';
    return date;
  };

  const formatDateForDisplay = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                Arrival Schedule Management
              </h1>
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="px-4 py-2 text-sm lg:text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Dashboard
              </button>
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

      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Arrival Schedule Management
            </h1>
            <p className="text-lg text-gray-600">Ignite 2026</p>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="mt-4 sm:mt-0 flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {isExporting ? 'Exporting...' : 'Export to CSV'}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Arrivals</p>
                <p className="text-3xl font-bold text-gray-900">{summary.totalArrivals}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">By Air</p>
                <p className="text-3xl font-bold text-gray-900">{summary.byAir}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">By Sea</p>
                <p className="text-3xl font-bold text-gray-900">{summary.bySea}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by name, email, or phone..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Transport Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transport Mode</label>
              <div className="relative">
                <select
                  value={filters.transportationType || ''}
                  onChange={(e) => setFilters({ ...filters, transportationType: e.target.value as TransportationType || undefined })}
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="">All Modes</option>
                  <option value="udara">By Air</option>
                  <option value="laut">By Sea</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={formatDateInput(filters.startDate || null)}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={formatDateInput(filters.endDate || null)}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Arrival Schedules */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-4 text-sm text-gray-600">Loading...</p>
            </div>
          </div>
        ) : arrivals.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600">No arrival schedules found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {arrivals.map((group) => (
              <div key={group.date} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{group.formattedDate}</h3>
                  <span className="text-sm text-gray-600">{group.count} {group.count === 1 ? 'arrival' : 'arrivals'}</span>
                </div>

                <div className="space-y-4">
                  {group.arrivals.map((arrival) => (
                    <div key={arrival.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Passenger Info */}
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-3">PASSENGER</p>
                          <p className="text-base font-semibold text-gray-900 mb-2">{arrival.fullName}</p>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>{arrival.email}</span>
                            </div>
                            {arrival.phoneNumber && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>{arrival.phoneNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Transport Info */}
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-3">TRANSPORT</p>
                          <div className="flex items-center gap-2 mb-2">
                            {arrival.transportationType === 'udara' ? (
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                              </svg>
                            )}
                            <span className="text-base font-semibold text-gray-900">
                              {arrival.transportationType === 'udara' ? 'By Air' : arrival.transportationType === 'laut' ? 'By Sea' : '-'}
                            </span>
                          </div>
                          {arrival.carrierName && (
                            <p className="text-sm text-gray-600">
                              {arrival.transportationType === 'udara' ? 'Airline' : 'Line'}: {arrival.carrierName}
                            </p>
                          )}
                          {arrival.flightNumber && (
                            <p className="text-sm text-gray-600">Flight: {arrival.flightNumber}</p>
                          )}
                        </div>

                        {/* Arrival Time */}
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-3">ARRIVAL TIME</p>
                          <p className="text-base font-semibold text-gray-900 mb-1">{formatTime(arrival.arrivalTime)}</p>
                          <p className="text-sm text-gray-600">in Batam</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
