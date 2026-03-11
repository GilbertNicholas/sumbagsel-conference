import Cookies from 'js-cookie';
import { removeAuthToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/** Convert relative payment proof path to full API URL */
export function getPaymentProofFullUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const base = API_BASE_URL.replace(/\/$/, '');
  return base ? `${base}${url}` : url;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string | null;
    isEmailVerified: boolean;
    status: string;
  };
  profileExists: boolean;
  profileCompleted: boolean;
}

export interface ProfileResponse {
  id: string;
  fullName: string;
  churchName: string;
  ministry: string | null;
  gender: string | null;
  contactEmail: string | null;
  phoneNumber: string | null;
  photoUrl: string | null;
  specialNotes: string | null;
  isCompleted: boolean;
}

export interface CreateProfileDto {
  fullName: string;
  churchName: string;
  ministry?: string;
  gender?: string;
  contactEmail?: string;
  phoneNumber?: string;
  photoUrl?: string;
  specialNotes?: string;
}

export interface UpdateProfileDto {
  fullName?: string;
  churchName?: string;
  ministry?: string;
  gender?: string;
  contactEmail?: string;
  phoneNumber?: string;
  photoUrl?: string;
  specialNotes?: string;
}

export type RegistrationStatus = 'Belum terdaftar' | 'Pending' | 'Terdaftar' | 'Daftar ulang';

export interface RegistrationChildResponse {
  id: string;
  name: string;
  age: number;
}

export interface RegistrationResponse {
  id: string;
  userId: string;
  paymentProofUrl: string | null;
  status: RegistrationStatus;
  uniqueCode: string | null;
  totalAmount: number | null;
  baseAmount: number | null;
  shirtSize: string | null;
  children: RegistrationChildResponse[];
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRegistrationDto {
  paymentProofUrl?: string;
}

export interface UpdateRegistrationDto {
  paymentProofUrl?: string;
}

export type TransportationType = 'laut' | 'udara';

export interface ArrivalScheduleResponse {
  id: string;
  transportationType: TransportationType | null;
  carrierName: string | null;
  flightNumber: string | null;
  arrivalDate: string | null;
  arrivalTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArrivalScheduleDto {
  transportationType?: TransportationType;
  carrierName?: string;
  flightNumber?: string;
  arrivalDate?: string;
  arrivalTime?: string;
}

export interface UpdateArrivalScheduleDto {
  transportationType?: TransportationType;
  carrierName?: string;
  flightNumber?: string;
  arrivalDate?: string;
  arrivalTime?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { _skipUserToken?: boolean } = {}
  ): Promise<T> {
    const { _skipUserToken, ...fetchOptions } = options;
    const token = _skipUserToken ? null : this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        // Handle 401 - session expired for protected endpoints only.
        // Login endpoints (request-otp, verify-otp, login) return 401 for invalid credentials,
        // not session expiry - jangan redirect, biarkan error message ditampilkan.
        const isLoginEndpoint =
          endpoint === '/admin/request-otp' ||
          endpoint === '/admin/verify-otp' ||
          endpoint === '/admin/login-with-phone' ||
          endpoint === '/admin/login' ||
          endpoint === '/auth/request-otp' ||
          endpoint === '/auth/verify-otp' ||
          endpoint === '/auth/login';
        if (
          response.status === 401 &&
          typeof window !== 'undefined' &&
          !isLoginEndpoint
        ) {
          const isAdminRequest = endpoint.startsWith('/admin');
          if (isAdminRequest) {
            localStorage.removeItem('admin_token');
            window.location.href = '/admin?sessionExpired=1';
          } else {
            removeAuthToken();
            window.location.href = '/auth/login?sessionExpired=1';
          }
          throw new Error('Session expired');
        }

        // Handle 404 as null for optional resources
        if (response.status === 404) {
          return null as T;
        }
        
        let errorMessage = 'An error occurred';
        try {
          const text = await response.text();
          if (text) {
            const error = JSON.parse(text);
            const msg = error.message || error.error || response.statusText;
            errorMessage = Array.isArray(msg) ? msg.join(', ') : msg;
          }
        } catch {
          errorMessage = response.statusText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        return null as T;
      }
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new Error('Invalid JSON response from server');
      }
    } catch (error) {
      // Handle network errors (CORS, connection refused, etc.)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(
          'Tidak dapat terhubung ke server. Pastikan backend berjalan di ' +
          this.baseUrl
        );
      }
      throw error;
    }
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return Cookies.get('token') || null;
  }

  // Auth endpoints
  /** Pre-fetch GKDI WhatsApp token. Call when user clicks "Daftar dengan WhatsApp" on landing. */
  async warmWhatsapp(): Promise<{ ready: boolean }> {
    return this.request<{ ready: boolean }>('/auth/warm-whatsapp', { method: 'GET' });
  }

  async requestOtp(identifier: string): Promise<{ sent: boolean }> {
    return this.request<{ sent: boolean }>('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    });
  }

  async verifyOtp(identifier: string, otp: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, otp }),
    });
  }

  /** @deprecated Use requestOtp + verifyOtp flow instead */
  async loginWithPhone(phoneNumber: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }

  // Profile endpoints
  async getMyProfile(): Promise<ProfileResponse> {
    return this.request<ProfileResponse>('/profiles/me');
  }

  async createProfile(data: CreateProfileDto): Promise<ProfileResponse> {
    return this.request<ProfileResponse>('/profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProfile(data: UpdateProfileDto): Promise<ProfileResponse> {
    return this.request<ProfileResponse>('/profiles/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async fixProfile(): Promise<ProfileResponse> {
    return this.request<ProfileResponse>('/profiles/me/fix', {
      method: 'POST',
    });
  }

  // Registration endpoints
  async getMyRegistration(): Promise<RegistrationResponse | null> {
    return this.request<RegistrationResponse | null>('/registrations/me', {
      cache: 'no-store',
    });
  }

  async createRegistration(data: CreateRegistrationDto): Promise<RegistrationResponse> {
    return this.request<RegistrationResponse>('/registrations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRegistration(data: UpdateRegistrationDto): Promise<RegistrationResponse> {
    return this.request<RegistrationResponse>('/registrations/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async createRegistrationWithChildren(data: { shirtSize?: string; children: { name: string; age: number }[] }): Promise<RegistrationResponse> {
    return this.request<RegistrationResponse>('/registrations/with-children', {
      method: 'POST',
      body: JSON.stringify(data),
      cache: 'no-store',
    });
  }

  async updateRegistrationWithChildren(data: { shirtSize?: string; children: { name: string; age: number }[] }): Promise<RegistrationResponse> {
    return this.request<RegistrationResponse>('/registrations/me/with-children', {
      method: 'PATCH',
      body: JSON.stringify(data),
      cache: 'no-store',
    });
  }

  async uploadPaymentProof(file: File): Promise<{ url: string }> {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/uploads/payment-proof`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const text = await response.text();
      let err: { message?: string; error?: string } = {};
      try {
        if (text) err = JSON.parse(text);
      } catch {}
      throw new Error(err.message || err.error || response.statusText || 'Upload failed');
    }
    const text = await response.text();
    if (!text || text.trim() === '') {
      throw new Error('Empty response from server');
    }
    return JSON.parse(text) as { url: string };
  }

  async submitRegistration(): Promise<RegistrationResponse> {
    return this.request<RegistrationResponse>('/registrations/me/submit', {
      method: 'POST',
    });
  }

  async resetRegistration(): Promise<void> {
    const token = this.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${this.baseUrl}/registrations/me`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
    if (!res.ok) {
      const text = await res.text();
      let err: { message?: string } = {};
      try {
        if (text) err = JSON.parse(text);
      } catch {}
      throw new Error(err.message || 'Gagal mengubah data pendaftaran');
    }
  }

  // Arrival Schedule endpoints
  async getMyArrivalSchedule(): Promise<ArrivalScheduleResponse | null> {
    return this.request<ArrivalScheduleResponse | null>('/arrival-schedules/me');
  }

  async createArrivalSchedule(data: CreateArrivalScheduleDto): Promise<ArrivalScheduleResponse> {
    return this.request<ArrivalScheduleResponse>('/arrival-schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateArrivalSchedule(data: UpdateArrivalScheduleDto): Promise<ArrivalScheduleResponse> {
    return this.request<ArrivalScheduleResponse>('/arrival-schedules/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Admin endpoints
  async adminLogin(code: string): Promise<AdminAuthResponse> {
    const response = await this.request<AdminAuthResponse>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    if (response.accessToken) {
      localStorage.setItem('admin_token', response.accessToken);
    }
    return response;
  }

  async adminRequestOtp(identifier: string): Promise<{ sent: boolean }> {
    return this.request<{ sent: boolean }>('/admin/request-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
      _skipUserToken: true,
    });
  }

  /** Bypass OTP - direct login. Only when NEXT_PUBLIC_OTP_BYPASS_DEV=true */
  async adminLoginByIdentifier(identifier: string): Promise<AdminAuthResponse> {
    const response = await this.request<AdminAuthResponse>('/admin/login-with-phone', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
      _skipUserToken: true,
    });
    if (response.accessToken) {
      localStorage.setItem('admin_token', response.accessToken);
    }
    return response;
  }

  async adminVerifyOtp(identifier: string, otp: string): Promise<AdminAuthResponse> {
    const response = await this.request<AdminAuthResponse>('/admin/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, otp }),
      _skipUserToken: true,
    });
    if (response.accessToken) {
      localStorage.setItem('admin_token', response.accessToken);
    }
    return response;
  }

  async getAdminMe(): Promise<AdminInfo> {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      throw new Error('No admin token found');
    }
    return this.request<AdminInfo>('/admin/me', {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
  }

  async getAllParticipants(): Promise<ParticipantResponse[]> {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      throw new Error('No admin token found');
    }
    return this.request<ParticipantResponse[]>('/admin/participants', {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
  }

  async getShirtData(filter?: { church?: string; size?: string }): Promise<ShirtDataResponse> {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      throw new Error('No admin token found');
    }
    const params = new URLSearchParams();
    if (filter?.church?.trim()) params.append('church', filter.church.trim());
    if (filter?.size?.trim()) params.append('size', filter.size.trim());
    const queryString = params.toString();
    return this.request<ShirtDataResponse>(`/admin/shirt-data${queryString ? `?${queryString}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
  }

  async getChildren(filter?: { church?: string; age?: string; checkInStatus?: string; search?: string }): Promise<ChildrenResponse> {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      throw new Error('No admin token found');
    }
    const params = new URLSearchParams();
    if (filter?.church?.trim()) params.append('church', filter.church.trim());
    if (filter?.age?.trim()) params.append('age', filter.age.trim());
    if (filter?.checkInStatus) params.append('checkInStatus', filter.checkInStatus);
    if (filter?.search?.trim()) params.append('search', filter.search.trim());
    const queryString = params.toString();
    return this.request<ChildrenResponse>(`/admin/children${queryString ? `?${queryString}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
  }

  async getParticipantById(id: string): Promise<ParticipantDetailResponse> {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      throw new Error('No admin token found');
    }
    return this.request<ParticipantDetailResponse>(`/admin/participants/${id}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
  }

  async approveRegistration(id: string): Promise<ParticipantDetailResponse> {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      throw new Error('No admin token found');
    }
    return this.request<ParticipantDetailResponse>(`/admin/participants/${id}/approve`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
  }

  async rejectRegistration(id: string, reason: string): Promise<ParticipantDetailResponse> {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      throw new Error('No admin token found');
    }
    return this.request<ParticipantDetailResponse>(`/admin/participants/${id}/reject`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reason: reason.trim() }),
    });
  }

  async checkInParticipant(id: string): Promise<ParticipantDetailResponse> {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      throw new Error('No admin token found');
    }
    return this.request<ParticipantDetailResponse>(`/admin/participants/${id}/check-in`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
  }

  adminLogout(): void {
    localStorage.removeItem('admin_token');
  }

  async getArrivalSchedules(filter?: ArrivalScheduleFilter): Promise<ArrivalScheduleGrouped[]> {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      throw new Error('No admin token found');
    }
    const params = new URLSearchParams();
    if (filter?.search && filter.search.trim()) params.append('search', filter.search.trim());
    if (filter?.transportationType) params.append('transportationType', filter.transportationType);
    if (filter?.startDate && filter.startDate.trim()) params.append('startDate', filter.startDate.trim());
    if (filter?.endDate && filter.endDate.trim()) params.append('endDate', filter.endDate.trim());
    
    const queryString = params.toString();
    return this.request<ArrivalScheduleGrouped[]>(`/admin/arrival-schedules${queryString ? `?${queryString}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
  }

  async getArrivalScheduleSummary(filter?: ArrivalScheduleFilter): Promise<ArrivalScheduleSummary> {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      throw new Error('No admin token found');
    }
    const params = new URLSearchParams();
    if (filter?.search && filter.search.trim()) params.append('search', filter.search.trim());
    if (filter?.transportationType) params.append('transportationType', filter.transportationType);
    if (filter?.startDate && filter.startDate.trim()) params.append('startDate', filter.startDate.trim());
    if (filter?.endDate && filter.endDate.trim()) params.append('endDate', filter.endDate.trim());
    
    const queryString = params.toString();
    return this.request<ArrivalScheduleSummary>(`/admin/arrival-schedules/summary${queryString ? `?${queryString}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
  }

  async exportArrivalSchedulesToCsv(filter?: ArrivalScheduleFilter): Promise<Blob> {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      throw new Error('No admin token found');
    }
    const params = new URLSearchParams();
    if (filter?.search) params.append('search', filter.search);
    if (filter?.transportationType) params.append('transportationType', filter.transportationType);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    
    const response = await fetch(`${this.baseUrl}/admin/arrival-schedules/export?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to export CSV');
    }
    
    return response.blob();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Admin types
export interface AdminAuthResponse {
  accessToken: string;
  admin: {
    id: string;
    code: string;
    name: string | null;
    role: 'master' | 'biasa';
  };
}

export interface AdminInfo {
  id: string;
  code: string;
  name: string | null;
  role: 'master' | 'biasa';
}

export interface ShirtDataRow {
  id: string;
  fullName: string;
  churchName: string;
  shirtSize: string;
  phoneNumber: string | null;
  email: string;
}

export interface ShirtDataResponse {
  totalsBySize: Record<string, number>;
  rows: ShirtDataRow[];
}

export interface ChildRow {
  id: string;
  childName: string;
  churchName: string;
  age: number;
  parentName: string;
  registrationId: string;
  checkedInAt: string | null;
}

export interface ChildrenResponse {
  total: number;
  rows: ChildRow[];
}

export interface ParticipantResponse {
  id: string;
  userId: string;
  fullName: string;
  churchName: string;
  ministry: string | null;
  gender: string | null;
  phoneNumber: string | null;
  email: string;
  status: string;
  paymentProofUrl: string | null;
  checkedInAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantDetailChild {
  id: string;
  name: string;
  age: number;
}

export interface ParticipantDetailResponse {
  id: string;
  userId: string;
  fullName: string;
  churchName: string;
  ministry?: string | null;
  gender?: string | null;
  phoneNumber: string | null;
  email: string;
  specialNotes: string | null;
  status: string;
  paymentProofUrl: string | null;
  children?: ParticipantDetailChild[];
  baseAmount: number | null;
  totalAmount: number | null;
  uniqueCode: string | null;
  shirtSize?: string | null;
  checkedInAt?: string | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArrivalScheduleFilter {
  search?: string;
  transportationType?: TransportationType;
  startDate?: string;
  endDate?: string;
}

export interface ArrivalScheduleItem {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  transportationType: string | null;
  carrierName: string | null;
  flightNumber: string | null;
  arrivalDate: string | null;
  arrivalTime: string | null;
  createdAt: string;
}

export interface ArrivalScheduleGrouped {
  date: string;
  formattedDate: string;
  count: number;
  arrivals: ArrivalScheduleItem[];
}

export interface ArrivalScheduleSummary {
  totalArrivals: number;
  byAir: number;
  bySea: number;
}
