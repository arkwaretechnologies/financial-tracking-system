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

interface CreateSaleRequest {
  client_id: string;
  store_id?: string;
  description?: string;
  payment_method?: 'cash' | 'card' | 'transfer' | string;
  amount: number;
  sales_date: string; // YYYY-MM-DD
  image_base64?: string;
  image_filename?: string;
}

export interface CreatePurchaseRequest {
  client_id: string;
  store_id?: string;
  user_id?: string;
  description?: string;
  supplier?: string;
  payment_method?: 'cash' | 'card' | 'check' | string;
  amount: number;
  purchase_date: string; // YYYY-MM-DD
  image_base64?: string;
  image_filename?: string;
  category?: string;
  other_category?: string;
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
      let errorMessage;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.details || errorData.error || `HTTP error! status: ${response.status}`;
      } else {
        errorMessage = await response.text();
      }
      throw new Error(errorMessage);
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

  // Add sales API support
  async createSale(token: string, saleData: CreateSaleRequest): Promise<{ sale: any; image_path?: string; message: string }> {
    return this.request<{ sale: any; image_path?: string; message: string }>(
      '/sales',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(saleData),
      }
    );
  }

  async getPurchases(token: string, clientId: string): Promise<{ purchases: any[] }> {
    return this.request(`/purchases/client/${clientId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async createPurchase(token: string, purchaseData: CreatePurchaseRequest): Promise<any> {
    return this.request('/purchases', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(purchaseData),
    });
  }

  async getSalesByClient(token: string, clientId: string): Promise<{ sales: any[] }> {
    return this.request<{ sales: any[] }>(`/sales/client/${clientId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getStoresByClient(token: string, clientId: string): Promise<{ stores: any[] }> {
    return this.request<{ stores: any[] }>(`/stores/client/${clientId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export const api = new ApiClient(API_BASE_URL);