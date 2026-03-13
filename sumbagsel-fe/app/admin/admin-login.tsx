'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';

const loginFormSchema = z.object({
  adminId: z.string().min(1, 'Admin ID harus diisi'),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get('sessionExpired') === '1';
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Bersihkan token lama saat membuka halaman login agar tidak ada session "nyangkut"
  useEffect(() => {
    apiClient.adminLogout();
  }, []);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      setIsLoading(true);
      await apiClient.adminLogin(data.adminId.trim());
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] min-h-[100svh] overflow-hidden flex flex-col bg-gray-50">
      <div className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
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
              Login Admin
            </h2>
            <p className="mt-2 lg:mt-3 text-center text-sm lg:text-base xl:text-lg text-gray-600">
              Masukkan Admin ID untuk masuk
            </p>
          </div>

          <form
            className="mt-8 space-y-6"
            onSubmit={loginForm.handleSubmit(onSubmit)}
          >
            {sessionExpired && (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-4 lg:p-5">
                <p className="text-sm lg:text-base text-amber-800">Session admin telah berakhir. Silakan login admin kembali.</p>
              </div>
            )}
            {error && (
              <div className="rounded-md bg-red-50 p-4 lg:p-5">
                <p className="text-sm lg:text-base text-red-800">{error}</p>
              </div>
            )}
            <div className="space-y-4 lg:space-y-5 rounded-md shadow-sm">
              <div>
                <label htmlFor="adminId" className="sr-only">
                  Admin ID
                </label>
                <input
                  {...loginForm.register('adminId')}
                  type="text"
                  autoComplete="username"
                  className="relative block w-full rounded-md border border-gray-300 px-3 py-2 lg:px-4 lg:py-3 xl:px-5 xl:py-4 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 text-sm lg:text-base xl:text-lg"
                  placeholder="Admin ID"
                />
                {loginForm.formState.errors.adminId && (
                  <p className="mt-1 text-sm lg:text-base text-red-600">
                    {loginForm.formState.errors.adminId.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 text-sm lg:text-base xl:text-lg font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Memproses...' : 'Masuk'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
