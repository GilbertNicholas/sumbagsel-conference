'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ProfileResponse, RegistrationResponse } from '@/lib/api-client';
import { capitalizeWords } from '@/lib/utils';
import { DashboardLayout } from '@/components/dashboard-layout';

const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const;
const CHILD_FEE = 75_000;

interface ChildInput {
  id: string;
  name: string;
  age: number;
  needsConsumption: boolean | null;
}

export function RegisterChildrenPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [registration, setRegistration] = useState<RegistrationResponse | null>(null);
  const [shirtSize, setShirtSize] = useState<string>('');
  const [children, setChildren] = useState<ChildInput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, { name?: string; age?: string; needsConsumption?: string }>>({});

  const canAddChildren = profile?.ministry === 'Single/S2' || profile?.ministry === 'Married';

  useEffect(() => {
    async function loadData() {
      try {
        const profileData = await apiClient.getMyProfile();
        if (!profileData) {
          router.push('/profile/setup');
          return;
        }
        setProfile(profileData);

        const storedShirtSize = typeof window !== 'undefined' ? sessionStorage.getItem('registerShirtSize') : null;
        if (storedShirtSize && SHIRT_SIZES.includes(storedShirtSize as (typeof SHIRT_SIZES)[number])) {
          setShirtSize(storedShirtSize);
        }

        const registrationData = await apiClient.getMyRegistration();
        if (registrationData) {
          setRegistration(registrationData);
          if (registrationData.shirtSize) setShirtSize(registrationData.shirtSize);
          if (registrationData.children?.length > 0) {
            setChildren(
              registrationData.children.map((c) => ({
                id: c.id,
                name: c.name,
                age: c.age,
                needsConsumption: c.needsConsumption ?? true,
              })),
            );
          } else {
            setChildren([{ id: crypto.randomUUID(), name: '', age: 0, needsConsumption: null }]);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat data');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [router]);

  useEffect(() => {
    if (!canAddChildren && !isLoading) {
      router.replace('/register');
    }
  }, [canAddChildren, isLoading, router]);

  const addChild = () => {
    setChildren((prev) => [...prev, { id: crypto.randomUUID(), name: '', age: 0, needsConsumption: null }]);
  };

  // Pastikan minimal 1 slot saat pertama masuk
  useEffect(() => {
    if (!isLoading && canAddChildren && children.length === 0) {
      setChildren([{ id: crypto.randomUUID(), name: '', age: 0, needsConsumption: null }]);
    }
  }, [isLoading, canAddChildren, children.length]);

  const removeChild = (id: string) => {
    setChildren((prev) => prev.filter((c) => c.id !== id));
  };

  const updateChild = (id: string, field: 'name' | 'age' | 'needsConsumption', value: string | number | boolean | null) => {
    setChildren((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleLanjutKePembayaran = async () => {
    setError(null);
    setFieldErrors({});

    if (!shirtSize || !SHIRT_SIZES.includes(shirtSize as (typeof SHIRT_SIZES)[number])) {
      setError('Size baju tidak valid. Kembali ke halaman sebelumnya.');
      return;
    }

    const newErrors: Record<string, { name?: string; age?: string; needsConsumption?: string }> = {};
    let hasError = false;

    children.forEach((child) => {
      const hasName = !!child.name.trim();
      const hasValidAge = child.age >= 7 && child.age <= 12;
      const hasNeedsConsumption = child.needsConsumption === true || child.needsConsumption === false;

      if (hasName && hasValidAge && !hasNeedsConsumption) {
        newErrors[child.id] = { ...newErrors[child.id], needsConsumption: 'Pilih perlu konsumsi atau tidak' };
        hasError = true;
      }
      if (hasName && !hasValidAge) {
        newErrors[child.id] = { ...newErrors[child.id], age: 'Pilih usia anak' };
        hasError = true;
      } else if (!hasName && hasValidAge) {
        newErrors[child.id] = { ...newErrors[child.id], name: 'Nama anak harus diisi' };
        hasError = true;
      }
    });

    if (hasError) {
      setFieldErrors(newErrors);
      return;
    }

    const childrenPayload = children
      .filter((c) => c.name.trim() && c.age >= 7 && c.age <= 12 && (c.needsConsumption === true || c.needsConsumption === false))
      .map((c) => ({ name: capitalizeWords(c.name.trim()), age: c.age, needsConsumption: c.needsConsumption! }));

    try {
      setIsSubmitting(true);
      const payload = { shirtSize, children: childrenPayload };
      let updated: RegistrationResponse;
      if (registration) {
        updated = await apiClient.updateRegistrationWithChildren(payload);
      } else {
        updated = await apiClient.createRegistrationWithChildren(payload);
      }
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('registerShirtSize');
        sessionStorage.setItem('registrationFromRegister', JSON.stringify(updated));
      }
      router.push('/register/payment?t=' + Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses pendaftaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 lg:h-12 lg:w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            <p className="mt-4 text-sm lg:text-base xl:text-lg text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!canAddChildren) {
    return null;
  }

  const validChildrenCount = children.filter((c) => c.name.trim() && c.age >= 7 && c.age <= 12 && (c.needsConsumption === true || c.needsConsumption === false)).length;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl lg:max-w-5xl xl:max-w-6xl pb-12 sm:pb-16 lg:pb-0">
        <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-6 lg:mb-8 text-center lg:text-left">
          Daftarkan anak usia 7-12 tahun (jika ada)
        </h1>

        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm lg:text-base text-amber-800">
            <strong>Biaya konsumsi Rp{new Intl.NumberFormat('id-ID').format(CHILD_FEE)} / anak</strong> jika anak perlu konsumsi
          </p>
          <p className="mt-2 text-sm lg:text-base text-amber-800">
            Anak usia 7-12 Tahun tidak mendapatkan baju Sumbagsel (jika ingin dapat dibeli secara terpisah)
          </p>
        </div>

        <p className="text-sm lg:text-base text-red-600 font-medium mb-6">
          Anak 13 tahun keatas dan Campus/Teens harus membuat akun dan mendaftar masing-masing
        </p>

        {/* Terdaftar count */}
        <div className="mb-4">
          <p className="text-base font-semibold text-gray-900">
            Terdaftar: {validChildrenCount} anak
          </p>
        </div>

        {/* Child slots - card style */}
        <div className="space-y-4 mb-6">
          {children.map((child) => (
            <div
              key={child.id}
              className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 items-stretch sm:items-start p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-1 min-w-0 sm:min-w-[120px] flex flex-col">
                <label className="block mb-1 text-sm font-medium text-gray-700">Nama</label>
                <input
                  type="text"
                  value={child.name}
                  onChange={(e) => updateChild(child.id, 'name', e.target.value)}
                  className={`block w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 ${
                    fieldErrors[child.id]?.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan nama lengkap anak"
                />
                <div className="mt-1 min-h-[1.25rem]">
                  {fieldErrors[child.id]?.name && (
                    <p className="text-sm text-red-600">{fieldErrors[child.id].name}</p>
                  )}
                </div>
              </div>
              <div className="w-full sm:w-36 flex flex-col">
                <label className="block mb-1 text-sm font-medium text-gray-700">Usia</label>
                <select
                  value={child.age}
                  onChange={(e) => updateChild(child.id, 'age', parseInt(e.target.value, 10))}
                  className={`block w-full rounded-lg border pl-3 pr-9 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 appearance-none bg-white ${
                    fieldErrors[child.id]?.age ? 'border-red-500' : 'border-gray-300'
                  }`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1.25rem',
                  }}
                >
                  <option value={0}>Pilih usia anak</option>
                  {[7, 8, 9, 10, 11, 12].map((a) => (
                    <option key={a} value={a}>
                      {a} tahun
                    </option>
                  ))}
                </select>
                <div className="mt-1 min-h-[1.25rem]">
                  {fieldErrors[child.id]?.age && (
                    <p className="text-sm text-red-600">{fieldErrors[child.id].age}</p>
                  )}
                </div>
              </div>
              <div className="w-full sm:w-auto flex flex-col sm:self-center">
                <label className="block mb-1 text-sm font-medium text-gray-700">Perlu konsumsi untuk anak?</label>
                <div className="flex gap-4 flex-wrap">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`needsConsumption-${child.id}`}
                      checked={child.needsConsumption === true}
                      onChange={() => updateChild(child.id, 'needsConsumption', true)}
                      className="rounded-full border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Ya</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`needsConsumption-${child.id}`}
                      checked={child.needsConsumption === false}
                      onChange={() => updateChild(child.id, 'needsConsumption', false)}
                      className="rounded-full border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Tidak</span>
                  </label>
                </div>
                <div className="mt-1 min-h-[1.25rem]">
                  {fieldErrors[child.id]?.needsConsumption && (
                    <p className="text-sm text-red-600">{fieldErrors[child.id].needsConsumption}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeChild(child.id)}
                className="rounded-md px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors w-full sm:w-auto self-end sm:mt-7 sm:self-start"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addChild}
          className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors mb-8"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah anak
        </button>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {error && (
            <div className="w-full max-w-xl rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm lg:text-base text-red-800">{error}</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => router.push('/register')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali
            </button>
            <button
              onClick={handleLanjutKePembayaran}
              disabled={isSubmitting}
              className="w-full sm:w-auto rounded-full px-8 py-3 lg:px-12 lg:py-4 xl:px-16 xl:py-5 text-base lg:text-lg xl:text-xl font-bold text-white transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed bg-[#C84343] hover:bg-[#A73535] hover:shadow-xl"
            >
              {isSubmitting ? 'Memproses...' : 'Lanjut ke pembayaran'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
