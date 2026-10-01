// Client API Service Layer
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  // Inject auth token from session/localStorage if available
  const token = localStorage.getItem('vanguard_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('vanguard_auth_token');
      }
      const errorMessage = data?.error || response.statusText || 'An API error occurred';
      throw new ApiError(errorMessage, response.status);
    }

    return (data && typeof data === 'object' && 'data' in data ? data.data : data) as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or server unreachable error
    throw new ApiError(
      error?.message || 'Unable to connect to the server. Please verify your connection.',
      0
    );
  }
}

export const api = {
  get<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'GET' });
  },

  post<T>(endpoint: string, body?: any): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: any): Promise<T> {
    return request<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE' });
  },
};
