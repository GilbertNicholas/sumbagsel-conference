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
        
        // Check if profile has valid data but isCompleted might be wrong
        if (profileData) {
          const hasValidFullName = profileData.fullName && 
            profileData.fullName.trim() !== '' && 
            profileData.fullName !== 'Belum diisi';
          const hasValidChurchName = profileData.churchName && 
            profileData.churchName.trim() !== '' && 
            profileData.churchName !== 'Belum diisi';
          const isProfileValid = hasValidFullName && hasValidChurchName;
          
          // If profile has valid data but isCompleted is false, fix it
          if (isProfileValid && !profileData.isCompleted) {
            try {
              await apiClient.fixProfile();
              // Reload profile after fix
              const fixedProfile = await apiClient.getMyProfile();
              setProfile(fixedProfile);
            } catch (fixError) {
              // If fix fails, continue with existing profile
              setProfile(profileData);
            }
          } else {
            setProfile(profileData);
          }
        }
        
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
          <p className="text-sm sm:text-base text-gray-600">Your Sumbagsel 2026 conference journey starts here!</p>
        </div>

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8 items-stretch">
            {/* Status Pendaftaran Card */}
            <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6 flex flex-col">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900">Status Pendaftaran</h3>
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
              <div className="mb-3 lg:mb-4 flex-1">
                <span className={`inline-block px-3 py-1 rounded-full text-xs lg:text-sm font-medium ${getStatusColor(registrationStatus)}`}>
                  {getStatusLabel(registrationStatus)}
                </span>
              </div>
              <div className="mt-auto">
                {showRegisterButton ? (
                  <button
                    onClick={() => router.push('/register')}
                    className="w-full bg-[#C84343] text-white px-4 py-2 rounded-md text-sm lg:text-base font-medium hover:bg-[#A73535] transition-colors"
                  >
                    Daftar Sekarang
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/register')}
                    className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm lg:text-base font-medium hover:bg-gray-50 transition-colors"
                  >
                    Lihat Status
                  </button>
                )}
              </div>
            </div>

            {/* Jadwal Kedatangan Card */}
            <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6 flex flex-col">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900">Jadwal Kedatangan</h3>
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {arrivalSchedule?.transportationType === 'udara' ? (
                    <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                    </svg>
                  ) : arrivalSchedule?.transportationType === 'laut' ? (
                    <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.14.52-.05.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
              </div>
              {arrivalSchedule?.arrivalDate ? (
                <div className="space-y-2 mb-3 lg:mb-4 flex-1">
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
                <p className="text-xs lg:text-sm text-gray-500 mb-3 lg:mb-4 flex-1">Belum ada jadwal kedatangan</p>
              )}
              <div className="mt-auto">
                <button
                  onClick={() => router.push('/schedule/arrival')}
                  className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm lg:text-base font-medium hover:bg-gray-50 transition-colors"
                >
                  Lihat Detail
                </button>
              </div>
            </div>

            {/* Profil Saya Card */}
            <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6 flex flex-col">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900">Profil Saya</h3>
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="mb-3 lg:mb-4 flex-1">
                <p className="text-xs lg:text-sm text-gray-600 mb-1">Nama</p>
                <p className="text-xs lg:text-sm font-medium text-gray-900 truncate">{profile?.fullName || '-'}</p>
              </div>
              <div className="mt-auto">
                <button
                  onClick={() => router.push('/profile/me')}
                  className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm lg:text-base font-medium hover:bg-gray-50 transition-colors"
                >
                  Lihat Profil
                </button>
              </div>
            </div>
        </div>

        {/* Upcoming Sessions Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 lg:mb-6 gap-2">
            <div>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Sesi yang akan datang</h2>
              <p className="text-xs lg:text-sm text-gray-600 mt-1">Sessions you might be interested in</p>
            </div>
            {registrationStatus === 'Terdaftar' && (
              <button className="text-xs lg:text-sm font-medium text-[#C84343] hover:text-[#A73535] transition-colors self-start sm:self-auto">
                View All &gt;
              </button>
            )}
          </div>
          {registrationStatus !== 'Terdaftar' ? (
            <div className="flex flex-col items-center justify-center py-10 lg:py-14">
              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 lg:w-8 lg:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm lg:text-base font-medium text-gray-700 mb-1">Kamu belum terdaftar konferensi</p>
              <p className="text-xs lg:text-sm text-gray-500 mb-5">Daftar sekarang untuk melihat jadwal sesi</p>
              <button
                onClick={() => router.push('/register')}
                className="bg-[#C84343] text-white px-6 py-2.5 rounded-full text-sm lg:text-base font-medium hover:bg-[#A73535] transition-colors shadow-sm"
              >
                Yuk Daftar
              </button>
            </div>
          ) : (
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
          )}
        </div>
      </div>
      )}
    </DashboardLayout>
  );
}
