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

export interface CreatePurchase {
  [key: string]: any;
}

export interface CreateExpenseRequest {
  client_id: string;
  store_id: string;
  user_id: string;
  description: string;
  paid_to: string;
  payment_method: string;
  amount: number;
  expense_date: string;
  image_base64?: string;
  image_filename?: string;
}

export interface Expense {
  id: string;
  expense_date: string;
  amount: number;
  description: string;
  paid_to: string;
  store_name: string;
  payment_method: string;
  supp_doc_url?: string;
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

  private async get<T>(endpoint: string, token?: string): Promise<T> {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return this.request<T>(endpoint, { headers });
  }

  private async post<T>(endpoint: string, data: any, token?: string): Promise<T> {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers,
    });
  }

  async validateClient(client_id: string): Promise<ValidateClientResponse> {
    return this.post('/auth/validate-client', { client_id });
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.post('/auth/login', data);
  }

  async getCurrentUser(token: string): Promise<{ user: LoginResponse['user'] }> {
    return this.get('/auth/me', token);
  }

  async getUsers(token: string): Promise<{ users: User[] }> {
    return this.get('/users', token);
  }

  async getUsersByClient(token: string, clientId: string): Promise<{ users: User[] }> {
    return this.get(`/users/client/${clientId}`, token);
  }

  async createUser(token: string, userData: CreateUserRequest): Promise<{ user: User; message: string }> {
    return this.post('/users', userData, token);
  }

  // Add sales API support
  async createSale(token: string, saleData: CreateSaleRequest): Promise<{ sale: any; image_path?: string; message: string }> {
    return this.post('/sales', saleData, token);
  }

  async getPurchases(token: string, clientId: string): Promise<{ purchases: any[] }> {
    return this.get(`/purchases/client/${clientId}`, token);
  }

  async createPurchase(token: string, purchaseData: CreatePurchaseRequest): Promise<any> {
    return this.post('/purchases', purchaseData, token);
  }

  async getExpensesByClient(token: string, clientId: string): Promise<{ expenses: any[] }> {
    return this.get(`/expenses/client/${clientId}`, token);
  }

  async createExpense(token: string, data: CreateExpenseRequest): Promise<any> {
    return this.post('/expenses', data, token);
  }

  async getSalesByClient(token: string, clientId: string): Promise<{ sales: any[] }> {
    return this.get(`/sales/client/${clientId}`, token);
  }

  async getStoresByClient(token: string, clientId: string): Promise<{ stores: any[] }> {
    return this.get(`/stores/client/${clientId}`, token);
  }
}

export const api = new ApiClient(API_BASE_URL);