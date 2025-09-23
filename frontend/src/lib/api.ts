const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface LoginRequest {
  client_id: string;
  username?: string;
  email?: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'client_user';
    client_id: string;
    first_name?: string;
    last_name?: string;
    store_id?: string;
    store_name?: string;
    created_at: string;
    client_name: string;
    client_email?: string;
    client_phone?: string;
    client_address?: string;
    client_created_at: string;
  };
  message: string;
}

interface ValidateClientResponse {
  valid: boolean;
  client: {
    id: string;
    name: string;
    contact_email?: string;
    contact_phone?: string;
    address?: string;
    created_at: string;
  };
}

interface ApiError {
  error: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin' | 'client_user';
  client_id: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  store_id?: string;
  is_active?: boolean;
}

interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'client_user';
  client_id: string;
  first_name?: string;
  last_name?: string;
  store_id?: string;
  is_active?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async validateClient(client_id: string): Promise<ValidateClientResponse> {
    return this.request<ValidateClientResponse>('/auth/validate-client', {
      method: 'POST',
      body: JSON.stringify({ client_id }),
    });
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(token: string): Promise<{ user: LoginResponse['user'] }> {
    return this.request<{ user: LoginResponse['user'] }>('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getUsers(token: string): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>('/users', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getUsersByClient(token: string, clientId: string): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>(`/users/client/${clientId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async createUser(token: string, userData: CreateUserRequest): Promise<{ user: User; message: string }> {
    return this.request<{ user: User; message: string }>('/users', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);