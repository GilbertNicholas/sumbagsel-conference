'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import { setAuthToken } from '@/lib/auth';

const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'Nomor WhatsApp harus diisi')
    .regex(
      /^(\+62|0)[0-9]{9,12}$/,
      'Nomor WhatsApp harus dalam format Indonesia (08xx atau +628xx)',
    ),
});

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'Kode OTP harus 6 digit')
    .regex(/^[0-9]{6}$/, 'Kode OTP harus berupa angka'),
});

type PhoneFormData = z.infer<typeof phoneSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

const RESEND_COOLDOWN_SECONDS = 60;

export function LoginPage() {
  const router = useRouter();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const onRequestOtp = async (data: PhoneFormData) => {
    try {
      setError(null);
      setIsLoading(true);
      await apiClient.requestOtp(data.phoneNumber);
      setPhoneNumber(data.phoneNumber);
      setShowOtpModal(true);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      otpForm.reset();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal mengirim kode verifikasi';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const onResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      setError(null);
      setIsLoading(true);
      await apiClient.requestOtp(phoneNumber);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal mengirim ulang kode';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOtp = async (data: OtpFormData) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await apiClient.verifyOtp(phoneNumber, data.otp);
      setAuthToken(response.accessToken);

      if (!response.profileCompleted) {
        router.push('/profile/setup');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Verifikasi gagal';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseOtpModal = () => {
    setShowOtpModal(false);
    setError(null);
    setResendCooldown(0);
    otpForm.reset();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl space-y-8 lg:space-y-10">
        <div>
          <div className="flex justify-center mb-6 lg:mb-8">
            <Image
              src="/images/sumbagsel-logo.png"
              alt="SumBagSel Conference Logo"
              width={1800}
              height={120}
              className="h-auto w-auto max-w-[300px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] xl:max-w-[700px] drop-shadow-lg"
              priority
            />
          </div>
          <h2 className="mt-6 lg:mt-8 text-center text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight text-gray-900">
            Masuk dengan WhatsApp
          </h2>
          <p className="mt-2 lg:mt-3 text-center text-sm lg:text-base xl:text-lg text-gray-600">
            Masukkan nomor WhatsApp Anda untuk menerima kode verifikasi
          </p>
        </div>

        <form
          className="mt-8 space-y-6"
          onSubmit={phoneForm.handleSubmit(onRequestOtp)}
        >
          {error && !showOtpModal && (
            <div className="rounded-md bg-red-50 p-4 lg:p-5">
              <p className="text-sm lg:text-base text-red-800">{error}</p>
            </div>
          )}
          <div className="space-y-4 lg:space-y-5 rounded-md shadow-sm">
            <div>
              <label htmlFor="phoneNumber" className="sr-only">
                Nomor WhatsApp
              </label>
              <input
                {...phoneForm.register('phoneNumber')}
                type="tel"
                autoComplete="tel"
                className="relative block w-full rounded-md border border-gray-300 px-3 py-2 lg:px-4 lg:py-3 xl:px-5 xl:py-4 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-sm lg:text-base xl:text-lg"
                placeholder="Nomor WhatsApp (08xx atau +628xx)"
              />
              {phoneForm.formState.errors.phoneNumber && (
                <p className="mt-1 text-sm lg:text-base text-red-600">
                  {phoneForm.formState.errors.phoneNumber.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 text-sm lg:text-base xl:text-lg font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Mengirim...' : 'Kirim Kode Verifikasi'}
            </button>
          </div>
        </form>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          aria-modal="true"
          role="dialog"
          aria-labelledby="otp-modal-title"
        >
          <div
            className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="otp-modal-title"
              className="text-lg font-semibold text-gray-900"
            >
              Masukkan Kode Verifikasi
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Kode 6 digit telah dikirim ke {phoneNumber}
            </p>

            <form
              className="mt-6 space-y-4"
              onSubmit={otpForm.handleSubmit(onVerifyOtp)}
            >
              {error && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              <div>
                <label htmlFor="otp" className="sr-only">
                  Kode OTP
                </label>
                <input
                  {...otpForm.register('otp')}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="Masukkan 6 digit kode"
                  className="relative block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-lg text-center tracking-[0.5em]"
                  autoFocus
                />
                {otpForm.formState.errors.otp && (
                  <p className="mt-1 text-sm text-red-600">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-md bg-blue-600 px-4 py-3 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Memverifikasi...' : 'Verifikasi & Masuk'}
                </button>
                <div className="flex flex-col items-center gap-2 text-sm">
                  {resendCooldown > 0 ? (
                    <p className="text-gray-500">
                      Kirim ulang dalam {resendCooldown} detik
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={onResendOtp}
                      disabled={isLoading}
                      className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                    >
                      Kirim ulang kode
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCloseOtpModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Ubah nomor
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
