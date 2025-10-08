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
  ref_num: string;
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
  ref_num: string;
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
  ref_num: string;
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

export interface CreateExpenseRequest {
  ref_num: string;
  client_id: string;
  store_id: string;
  user_id: string;
  description: string;
  paid_to: string;
  payment_method: 'cash' | 'card' | 'check';
  amount: number;
  expense_date: string;
  image_base64?: string;
  image_filename?: string;
}

export interface Expense {
  id: string;
  ref_num: string;
  client_id: string;
  store_id: string;
  user_id: string;
  expense_date: string;
  amount: number;
  description: string;
  paid_to: string;
  store_name: string;
  payment_method: 'cash' | 'card' | 'check';
  supp_doc_url?: string;
}

export interface Purchase {
  ref_num: string;
  purchase_date: string;
  amount: number;
  description: string;
  supplier: string;
  store_name: string;
  payment_method: string;
  supp_doc_url?: string;
  category?: string;
}

export interface Sale {
  ref_num: string;
  sales_date: string;
  amount: number;
  description: string;
  store_name: string;
  payment_method: string;
  supp_doc_url?: string;
}

interface Store {
  id: string;
  name: string;
  client_id: string;
  created_at: string;
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
        ...(options.headers || {}),
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

  private async post<T, TBody>(endpoint: string, data: TBody, token?: string): Promise<T> {
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

  private async put<T, TBody>(endpoint: string, data: TBody, token?: string): Promise<T> {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers,
    });
  }

  private async delete<T>(endpoint: string, token?: string): Promise<T> {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return this.request<T>(endpoint, { method: 'DELETE', headers });
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

  async getStoresByClient(token: string, clientId: string): Promise<{ stores: Store[] }> {
    return this.get(`/stores/client/${clientId}`, token);
  }

  async createUser(token: string, userData: CreateUserRequest): Promise<{ user: User; message: string }> {
    return this.post('/users', userData, token);
  }

  // Add sales API support
  async createSale(token: string, saleData: CreateSaleRequest): Promise<{ sale: Sale; image_path?: string; message: string }> {
    return this.post('/sales', saleData, token);
  }

  async updateSale(token: string, refNum: string, saleData: Partial<CreateSaleRequest>): Promise<{ sale: Sale; message: string }> {
    return this.put(`/sales/${refNum}`, saleData, token);
  }

  async deleteSale(token: string, refNum: string): Promise<{ message: string }> {
    return this.delete(`/sales/${refNum}`, token);
  }

  async getSalesByClient(token: string, clientId: string, storeId: string, searchRefNum?: string, searchDescription?: string, page?: number, pageSize?: number): Promise<{ sales: Sale[], count: number }> {
    const query = new URLSearchParams();
    if (storeId) query.append('storeId', storeId);
    if (searchRefNum) query.append('searchRefNum', searchRefNum);
    if (searchDescription) query.append('searchDescription', searchDescription);
    if (page) query.append('page', page.toString());
    if (pageSize) query.append('pageSize', pageSize.toString());

    return this.get(`/sales/client/${clientId}?${query.toString()}`, token);
  }

  async getPurchasesByClient(token: string, clientId: string, storeId: string, refNum?: string, description?: string, page?: number, pageSize?: number): Promise<{ purchases: Purchase[], count: number }> {
    const query = new URLSearchParams();
    if (storeId) query.append('storeId', storeId);
    if (refNum) query.append('refNum', refNum);
    if (description) query.append('description', description);
    if (page) query.append('page', page.toString());
    if (pageSize) query.append('pageSize', pageSize.toString());

    return this.get(`/purchases/client/${clientId}?${query.toString()}`, token);
  }

  async createPurchase(token: string, purchaseData: CreatePurchaseRequest): Promise<{ purchase: Purchase; image_path?: string; message: string }> {
    return this.post('/purchases', purchaseData, token);
  }

  async updatePurchase(token: string, refNum: string, data: Partial<CreatePurchaseRequest>): Promise<{purchase: Purchase, message: string}> {
    return this.put(`/purchases/${refNum}`, data, token);
  }

  async deletePurchase(token: string, refNum: string): Promise<{message: string}> {
    return this.delete(`/purchases/${refNum}`, token);
  }

  async getExpenses(token: string, clientId: string, storeId: string, refNum?: string, description?: string): Promise<Expense[]> {
    const params = new URLSearchParams();
    if (refNum) params.append('refNum', refNum);
    if (description) params.append('description', description);

    const url = `/expenses/client/${clientId}/store/${storeId}?${params.toString()}`;
    return this.get<Expense[]>(url, token);
  }

  async createExpense(token: string, data: CreateExpenseRequest): Promise<Expense> {
    return this.post<Expense, CreateExpenseRequest>('/expenses', data, token);
  }

  async updateExpense(token: string, refNum: string, expenseData: Partial<CreateExpenseRequest>): Promise<{expense: Expense, message: string}> {
    return this.put(`/expenses/${refNum}`, expenseData, token);
  }

  async deleteExpense(token: string, refNum: string): Promise<{message: string}> {
    return this.delete(`/expenses/${refNum}`, token);
  }

  async getGrossIncome(token: string, clientId: string, startDate: string, endDate: string, store_id?: string): Promise<{grossIncome: number}> {
    let url = `/reports/gross-income?clientId=${clientId}&startDate=${startDate}&endDate=${endDate}`;
    if (store_id && store_id !== 'all') {
      url += `&store_id=${store_id}`;
    }
    return this.get(url, token);
  }

  async getTotalSales(token: string, clientId: string, store_id?: string): Promise<{ totalSales: number }> {
    let url = `/reports/total-sales?clientId=${clientId}`;
    if (store_id && store_id !== 'all') {
      url += `&store_id=${store_id}`;
    }
    return this.get(url, token);
  }

  async getTotalSalesByDate(token: string, clientId: string, startDate: string, endDate: string, store_id?: string): Promise<{ totalSales: number }> {
    let url = `/reports/total-sales-by-date?clientId=${clientId}&startDate=${startDate}&endDate=${endDate}`;
    if (store_id && store_id !== 'all') {
      url += `&store_id=${store_id}`;
    }
    return this.get(url, token);
  }

  async getTotalPurchases(token: string, clientId: string, store_id?: string): Promise<{ totalPurchases: number }> {
    let url = `/reports/total-purchases?clientId=${clientId}`;
    if (store_id && store_id !== 'all') {
      url += `&store_id=${store_id}`;
    }
    return this.get(url, token);
  }

  async getTotalPurchasesByDate(token: string, clientId: string, startDate: string, endDate: string, store_id?: string): Promise<{ totalPurchases: number }> {
    let url = `/reports/total-purchases-by-date?clientId=${clientId}&startDate=${startDate}&endDate=${endDate}`;
    if (store_id && store_id !== 'all') {
      url += `&store_id=${store_id}`;
    }
    return this.get(url, token);
  }

  async getTotalExpenses(token: string, clientId: string, store_id?: string): Promise<{ totalExpenses: number }> {
    let url = `/reports/total-expenses?clientId=${clientId}`;
    if (store_id && store_id !== 'all') {
      url += `&store_id=${store_id}`;
    }
    return this.get(url, token);
  }

  async getTotalExpensesByDate(token: string, clientId: string, startDate: string, endDate: string, store_id?: string): Promise<{ totalExpenses: number }> {
    let url = `/reports/total-expenses-by-date?clientId=${clientId}&startDate=${startDate}&endDate=${endDate}`;
    if (store_id && store_id !== 'all') {
      url += `&store_id=${store_id}`;
    }
    return this.get(url, token);
  }
}

export const api = new ApiClient(API_BASE_URL);