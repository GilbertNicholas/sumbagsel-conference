'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import { setAuthToken } from '@/lib/auth';

const signupSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  confirmPassword: z.string().min(8, 'Konfirmasi password harus diisi'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await apiClient.signup(data.email, data.password);
      setAuthToken(response.accessToken);

      // Redirect to profile setup after signup
      router.push('/profile/setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrasi gagal');
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
            Buat akun baru
          </h2>
          <p className="mt-2 lg:mt-3 text-center text-sm lg:text-base xl:text-lg text-gray-600">
            Atau{' '}
            <a
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              masuk ke akun yang sudah ada
            </a>
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
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="relative block w-full rounded-md border border-gray-300 px-3 py-2 lg:px-4 lg:py-3 xl:px-5 xl:py-4 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-sm lg:text-base xl:text-lg"
                placeholder="Email"
              />
              {errors.email && (
                <p className="mt-1 text-sm lg:text-base text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="new-password"
                className="relative block w-full rounded-md border border-gray-300 px-3 py-2 lg:px-4 lg:py-3 xl:px-5 xl:py-4 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-sm lg:text-base xl:text-lg"
                placeholder="Password (minimal 8 karakter)"
              />
              {errors.password && (
                <p className="mt-1 text-sm lg:text-base text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Konfirmasi Password
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                autoComplete="new-password"
                className="relative block w-full rounded-md border border-gray-300 px-3 py-2 lg:px-4 lg:py-3 xl:px-5 xl:py-4 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-sm lg:text-base xl:text-lg"
                placeholder="Konfirmasi Password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm lg:text-base text-red-600">
                  {errors.confirmPassword.message}
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
              {isLoading ? 'Memproses...' : 'Daftar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

