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
            <p className="mt-4 text-sm lg:text-base xl:text-lg text-gray-600">Loading...</p>
          </div>
        </div>
      ) : (
      <div className="mx-auto max-w-3xl lg:max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Arrival Schedule in Batam
          </h1>
          <p className="text-base lg:text-lg text-gray-600">
            Please provide your arrival details for proper arrangement
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
          {/* Mode of Transportation */}
          <div>
            <label className="block mb-3 text-base lg:text-lg font-medium text-gray-700">
              Mode of Transportation
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span className="font-medium">By Air</span>
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                <span className="font-medium">By Sea</span>
              </button>
            </div>
            <input type="hidden" {...register('transportationType')} />
          </div>

          {/* Flight Number (for Air) */}
          {isAirTransport && (
            <div>
              <label htmlFor="flightNumber" className="block mb-2 text-base lg:text-lg font-medium text-gray-700">
                Flight Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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

          {/* Airline Name (for Air) or Shipping Line (for Sea) */}
          <div>
            <label htmlFor="carrierName" className="block mb-2 text-base lg:text-lg font-medium text-gray-700">
              {isAirTransport ? 'Airline Name' : 'Shipping Line'}
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

          {/* Arrival Date */}
          <div>
            <label htmlFor="arrivalDate" className="block mb-2 text-base lg:text-lg font-medium text-gray-700">
              Arrival Date
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

          {/* Arrival Time in Batam */}
          <div>
            <label htmlFor="arrivalTime" className="block mb-2 text-base lg:text-lg font-medium text-gray-700">
              Arrival Time in Batam
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

          {/* Arrival Summary */}
          {(transportationType || carrierName || flightNumber || arrivalDate || arrivalTime) && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6">
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4">Arrival Summary</h3>
              <div className="space-y-2 text-base lg:text-lg text-gray-700">
                <p>
                  Mode: <span className="font-semibold">{transportationType === 'udara' ? 'By Air' : transportationType === 'laut' ? 'By Sea' : '-'}</span>
                </p>
                {isAirTransport && flightNumber && (
                  <p>
                    Flight: <span className="font-semibold">{flightNumber}</span>
                  </p>
                )}
                {carrierName && (
                  <p>
                    {isAirTransport ? 'Airline' : 'Shipping Line'}: <span className="font-semibold">{carrierName}</span>
                  </p>
                )}
                {arrivalDate && arrivalTime && (
                  <p>
                    Date & Time: <span className="font-semibold">
                      {new Date(arrivalDate).toISOString().split('T')[0]} at {(() => {
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

          {/* Save Button */}
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
            <span>{isSaving ? 'Saving...' : 'Save Arrival Details'}</span>
          </button>

          {/* Edit Button (when not in edit mode) */}
          {!isEditMode && arrivalSchedule && (
            <button
              type="button"
              onClick={handleEdit}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit Arrival Details</span>
            </button>
          )}
        </form>
      </div>
      )}
    </DashboardLayout>
  );
}
