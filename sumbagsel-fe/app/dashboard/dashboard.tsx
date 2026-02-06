'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ProfileResponse, RegistrationResponse, ArrivalScheduleResponse, RegistrationStatus } from '@/lib/api-client';
import { DashboardLayout } from '@/components/dashboard-layout';

// Dummy sessions data
const dummySessions = [
  {
    id: 1,
    title: 'Opening Keynote: Faith Forward',
    speaker: 'Pastor David Chen',
    date: 'Day 1',
    time: '9:00 AM - 10:30 AM',
    location: 'Main Auditorium',
  },
  {
    id: 2,
    title: 'Workshop: Leading Through Change',
    speaker: 'Dr. Sarah Williams',
    date: 'Day 1',
    time: '11:00 AM - 12:30 PM',
    location: 'Room 201',
  },
  {
    id: 3,
    title: 'Panel: Youth Ministry in 2026',
    speaker: 'Multiple Speakers',
    date: 'Day 1',
    time: '2:00 PM - 3:30 PM',
    location: 'Conference Hall B',
  },
];

export function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [registration, setRegistration] = useState<RegistrationResponse | null>(null);
  const [arrivalSchedule, setArrivalSchedule] = useState<ArrivalScheduleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [profileData, registrationData, arrivalData] = await Promise.all([
          apiClient.getMyProfile().catch(() => null),
          apiClient.getMyRegistration().catch(() => null),
          apiClient.getMyArrivalSchedule().catch(() => null),
        ]);
        
        setProfile(profileData);
        setRegistration(registrationData);
        setArrivalSchedule(arrivalData);
      } catch (error) {
        // If profile doesn't exist, redirect to setup
        router.push('/profile/setup');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [router]);

  const getStatusColor = (status: RegistrationStatus) => {
    switch (status) {
      case 'Terdaftar':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Belum terdaftar':
        return 'bg-gray-100 text-gray-800';
      case 'Daftar ulang':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: RegistrationStatus) => {
    switch (status) {
      case 'Pending':
        return 'Pending';
      default:
        return status;
    }
  };

  const registrationStatus: RegistrationStatus = registration?.status || 'Belum terdaftar';
  const showRegisterButton = registrationStatus !== 'Terdaftar';

  return (
    <DashboardLayout>
      {isLoading ? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 lg:h-12 lg:w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-sm lg:text-base xl:text-lg text-gray-600">Loading...</p>
          </div>
        </div>
      ) : (
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
            Welcome back, {profile?.fullName || 'User'}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Your conference journey starts here</p>
        </div>

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {/* Status Pendaftaran Card */}
            <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900">Status Pendaftaran</h3>
              </div>
              <div className="mb-3 lg:mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs lg:text-sm font-medium ${getStatusColor(registrationStatus)}`}>
                  {getStatusLabel(registrationStatus)}
                </span>
              </div>
              {showRegisterButton && (
                <button
                  onClick={() => router.push('/register')}
                  className="w-full bg-[#C84343] text-white px-4 py-2 rounded-md text-sm lg:text-base font-medium hover:bg-[#A73535] transition-colors"
                >
                  Daftar Sekarang
                </button>
              )}
            </div>

            {/* Jadwal Kedatangan Card */}
            <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900">Jadwal Kedatangan</h3>
                {arrivalSchedule?.transportationType && (
                  <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center flex-shrink-0">
                    {arrivalSchedule.transportationType === 'udara' ? (
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              {arrivalSchedule?.arrivalDate ? (
                <div className="space-y-2 mb-3 lg:mb-4">
                  <p className="text-xs lg:text-sm text-gray-600">
                    {arrivalSchedule.transportationType === 'udara' ? 'Pesawat' : 'Kapal'}
                  </p>
                  <p className="text-xs lg:text-sm font-medium text-gray-900">
                    {arrivalSchedule.carrierName} {arrivalSchedule.flightNumber}
                  </p>
                  <p className="text-xs lg:text-sm text-gray-600">
                    {new Date(arrivalSchedule.arrivalDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ) : (
                <p className="text-xs lg:text-sm text-gray-500 mb-3 lg:mb-4">Belum ada jadwal kedatangan</p>
              )}
              <button
                onClick={() => router.push('/schedule/arrival')}
                className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm lg:text-base font-medium hover:bg-gray-50 transition-colors"
              >
                Lihat Detail
              </button>
            </div>

            {/* Profil Saya Card */}
            <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900">Profil Saya</h3>
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="mb-3 lg:mb-4">
                <p className="text-xs lg:text-sm text-gray-600 mb-1">Nama</p>
                <p className="text-xs lg:text-sm font-medium text-gray-900 truncate">{profile?.fullName || '-'}</p>
              </div>
              <button
                onClick={() => router.push('/profile/me')}
                className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm lg:text-base font-medium hover:bg-gray-50 transition-colors"
              >
                Lihat Profil
              </button>
            </div>
        </div>

        {/* Upcoming Sessions Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 lg:mb-6 gap-2">
            <div>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Upcoming Sessions</h2>
              <p className="text-xs lg:text-sm text-gray-600 mt-1">Sessions you might be interested in</p>
            </div>
            <button className="text-xs lg:text-sm font-medium text-[#C84343] hover:text-[#A73535] transition-colors self-start sm:self-auto">
              View All &gt;
            </button>
          </div>
          <div className="space-y-3 lg:space-y-4">
            {dummySessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-start gap-3 lg:gap-4 p-3 lg:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-1">{session.title}</h3>
                        <p className="text-xs lg:text-sm text-gray-600 mb-2">by {session.speaker}</p>
                        <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm text-gray-500">
                          <span>{session.time}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{session.location}</span>
                        </div>
                      </div>
                      <span className="px-2 lg:px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full flex-shrink-0 self-start sm:self-auto">
                        {session.date}
                      </span>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
    </DashboardLayout>
  );
}
