'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import { setAuthToken } from '@/lib/auth';

const loginSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'Nomor WhatsApp harus diisi')
    .regex(/^(\+62|0)[0-9]{9,12}$/, 'Nomor WhatsApp harus dalam format Indonesia (08xx atau +628xx)'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await apiClient.loginWithPhone(data.phoneNumber);
      setAuthToken(response.accessToken);

      // Redirect based on profile status
      if (!response.profileCompleted) {
        router.push('/profile/setup');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setIsLoading(false);
    }
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
            Masukkan nomor WhatsApp Anda untuk masuk
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
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
                {...register('phoneNumber')}
                type="tel"
                autoComplete="tel"
                className="relative block w-full rounded-md border border-gray-300 px-3 py-2 lg:px-4 lg:py-3 xl:px-5 xl:py-4 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-sm lg:text-base xl:text-lg"
                placeholder="Nomor WhatsApp (08xx atau +628xx)"
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm lg:text-base text-red-600">
                  {errors.phoneNumber.message}
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
              {isLoading ? 'Memproses...' : 'Masuk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

