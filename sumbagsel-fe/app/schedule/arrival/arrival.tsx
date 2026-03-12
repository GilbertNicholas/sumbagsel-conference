'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/dashboard-layout';
import { apiClient, ArrivalScheduleResponse } from '@/lib/api-client';

const arrivalSchema = z.object({
  transportationType: z.enum(['laut', 'udara']).optional(),
  carrierName: z.string().optional(),
  flightNumber: z.string().optional(),
  arrivalDate: z.string().optional(),
  arrivalTime: z.string().optional(),
});

type ArrivalFormData = z.infer<typeof arrivalSchema>;

export function ArrivalSchedulePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [arrivalSchedule, setArrivalSchedule] = useState<ArrivalScheduleResponse | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ArrivalFormData>({
    resolver: zodResolver(arrivalSchema),
    defaultValues: {
      transportationType: undefined,
      carrierName: '',
      flightNumber: '',
      arrivalDate: '',
      arrivalTime: '',
    },
  });

  const transportationType = watch('transportationType');
  const carrierName = watch('carrierName');
  const flightNumber = watch('flightNumber');
  const arrivalDate = watch('arrivalDate');
  const arrivalTime = watch('arrivalTime');
  const isAirTransport = transportationType === 'udara';

  useEffect(() => {
    async function loadArrivalSchedule() {
      try {
        const data = await apiClient.getMyArrivalSchedule();
        if (data) {
          setArrivalSchedule(data);
          
          // Auto-fill form dengan data yang ada
          if (data.transportationType) {
            setValue('transportationType', data.transportationType);
          }
          if (data.carrierName) {
            setValue('carrierName', data.carrierName);
          }
          if (data.flightNumber) {
            setValue('flightNumber', data.flightNumber);
          }
          if (data.arrivalDate) {
            // Convert date to YYYY-MM-DD format
            const date = new Date(data.arrivalDate);
            setValue('arrivalDate', date.toISOString().split('T')[0]);
          }
          if (data.arrivalTime) {
            setValue('arrivalTime', data.arrivalTime);
          }
          setIsEditMode(false);
        } else {
          setIsEditMode(true);
        }
      } catch (err) {
        // Arrival schedule not found, that's okay
        setIsEditMode(true);
      } finally {
        setIsLoading(false);
      }
    }
    loadArrivalSchedule();
  }, [setValue]);

  const handleEdit = () => {
    setIsEditMode(true);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async (data: ArrivalFormData) => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      const arrivalScheduleData = {
        transportationType: data.transportationType,
        carrierName: data.carrierName || undefined,
        flightNumber: data.flightNumber || undefined,
        arrivalDate: data.arrivalDate || undefined,
        arrivalTime: data.arrivalTime || undefined,
      };
      
      let savedSchedule: ArrivalScheduleResponse;
      if (arrivalSchedule) {
        savedSchedule = await apiClient.updateArrivalSchedule(arrivalScheduleData);
      } else {
        savedSchedule = await apiClient.createArrivalSchedule(arrivalScheduleData);
      }
      
      setArrivalSchedule(savedSchedule);
      setSuccess('Jadwal kedatangan berhasil disimpan');
      setIsEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan jadwal kedatangan');
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <DashboardLayout>
      {isLoading ? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 lg:h-12 lg:w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-sm lg:text-base xl:text-lg text-gray-600">Memuat...</p>
          </div>
        </div>
      ) : (
      <div className="mx-auto max-w-3xl lg:max-w-4xl pb-12 sm:pb-16 lg:pb-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Jadwal Kedatangan di Batam
          </h1>
          <p className="text-base lg:text-lg text-gray-600">
            Mohon lengkapi detail kedatangan Anda untuk pengaturan yang tepat
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
            <p className="text-sm lg:text-base text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-6">
            <p className="text-sm lg:text-base text-green-800">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
          {/* Moda Transportasi */}
          <div>
            <label className="block mb-3 text-base lg:text-lg font-medium text-gray-700">
              Moda Transportasi
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  if (isEditMode) {
                    setValue('transportationType', 'udara');
                  }
                }}
                disabled={!isEditMode}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-lg border-2 transition-all ${
                  transportationType === 'udara'
                    ? 'bg-amber-50 border-amber-400 text-amber-900'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                } ${!isEditMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
                <span className="font-medium">Via Udara</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isEditMode) {
                    setValue('transportationType', 'laut');
                  }
                }}
                disabled={!isEditMode}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-lg border-2 transition-all ${
                  transportationType === 'laut'
                    ? 'bg-amber-50 border-amber-400 text-amber-900'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                } ${!isEditMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.14.52-.05.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z" />
                </svg>
                <span className="font-medium">Via Laut</span>
              </button>
            </div>
            <input type="hidden" {...register('transportationType')} />
          </div>

          {/* Nomor Penerbangan (untuk Udara) */}
          {isAirTransport && (
            <div>
              <label htmlFor="flightNumber" className="block mb-2 text-base lg:text-lg font-medium text-gray-700">
                Nomor Penerbangan
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                  </svg>
                </div>
                <input
                  {...register('flightNumber')}
                  type="text"
                  disabled={!isEditMode}
                  className={`block w-full rounded-lg border border-gray-300 pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all ${
                    !isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  placeholder="GA-120"
                />
              </div>
            </div>
          )}

          {/* Nama Maskapai (untuk Udara) atau Nama Kapal (untuk Laut) */}
          <div>
            <label htmlFor="carrierName" className="block mb-2 text-base lg:text-lg font-medium text-gray-700">
              {isAirTransport ? 'Nama Maskapai' : 'Nama Kapal/Pelabuhan'}
            </label>
            <input
              {...register('carrierName')}
              type="text"
              disabled={!isEditMode}
              className={`block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all ${
                !isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder={isAirTransport ? 'Garuda Indonesia' : 'Garuda Indonesia'}
            />
          </div>

          {/* Tanggal Kedatangan */}
          <div>
            <label htmlFor="arrivalDate" className="block mb-2 text-base lg:text-lg font-medium text-gray-700">
              Tanggal Kedatangan
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                {...register('arrivalDate')}
                type="date"
                disabled={!isEditMode}
                className={`block w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all ${
                  !isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                }`}
              />
            </div>
          </div>

          {/* Waktu Kedatangan di Batam */}
          <div>
            <label htmlFor="arrivalTime" className="block mb-2 text-base lg:text-lg font-medium text-gray-700">
              Waktu Kedatangan di Batam
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <input
                {...register('arrivalTime')}
                type="time"
                disabled={!isEditMode}
                className={`block w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all ${
                  !isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                }`}
              />
            </div>
          </div>

          {/* Ringkasan Kedatangan */}
          {(transportationType || carrierName || flightNumber || arrivalDate || arrivalTime) && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6">
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4">Ringkasan Kedatangan</h3>
              <div className="space-y-2 text-base lg:text-lg text-gray-700">
                <p>
                  Moda: <span className="font-semibold">{transportationType === 'udara' ? 'Via Udara' : transportationType === 'laut' ? 'Via Laut' : '-'}</span>
                </p>
                {isAirTransport && flightNumber && (
                  <p>
                    Penerbangan: <span className="font-semibold">{flightNumber}</span>
                  </p>
                )}
                {carrierName && (
                  <p>
                    {isAirTransport ? 'Maskapai' : 'Kapal'}: <span className="font-semibold">{carrierName}</span>
                  </p>
                )}
                {arrivalDate && arrivalTime && (
                  <p>
                    Tanggal & Waktu: <span className="font-semibold">
                      {new Date(arrivalDate).toISOString().split('T')[0]} pukul {(() => {
                        const [hours, minutes] = arrivalTime.split(':');
                        const hour24 = parseInt(hours, 10);
                        return `${hour24}:${minutes}`;
                      })()}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tombol Simpan */}
          <button
            type="submit"
            disabled={isSaving || !isEditMode}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-medium text-white transition-all ${
              isSaving || !isEditMode
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#8B4513] hover:bg-[#6B3410] shadow-lg hover:shadow-xl'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Jadwal Kedatangan'}</span>
          </button>

          {/* Tombol Edit (saat tidak dalam mode edit) */}
          {!isEditMode && arrivalSchedule && (
            <button
              type="button"
              onClick={handleEdit}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit Jadwal Kedatangan</span>
            </button>
          )}
        </form>
      </div>
      )}
    </DashboardLayout>
  );
}
