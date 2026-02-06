'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';

const loginSchema = z.object({
  code: z.string().min(1, 'Kode admin harus diisi'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function AdminLoginPage() {
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
      await apiClient.adminLogin(data.code);
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-[10%]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <Image
            src="/images/sumbagsel-logo.png"
            alt="Sumbagsel Logo"
            width={200}
            height={200}
            className="max-w-[150px] sm:max-w-[200px] lg:max-w-[250px]"
            priority
          />
        </div>
        <h2 className="mt-6 text-center text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900">
          Login Admin
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="code"
                className="block text-sm lg:text-base xl:text-lg font-medium text-gray-700"
              >
                Kode Admin
              </label>
              <div className="mt-1">
                <input
                  {...register('code')}
                  type="text"
                  autoComplete="off"
                  className="appearance-none block w-full px-3 py-2 lg:px-4 lg:py-3 xl:px-5 xl:py-4 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm lg:text-base xl:text-lg"
                  placeholder="Masukkan kode admin"
                />
                {errors.code && (
                  <p className="mt-2 text-sm text-red-600">{errors.code.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 lg:py-3 xl:py-4 px-4 border border-transparent rounded-md shadow-sm text-sm lg:text-base xl:text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
