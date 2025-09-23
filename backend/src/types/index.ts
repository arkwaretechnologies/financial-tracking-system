export interface User {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin' | 'client_user';
  client_id?: string;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  created_at: string;
}

export interface Store {
  id: string;
  client_id: string;
  name: string;
  location: string;
}

export interface Transaction {
  id: string;
  store_id: string;
  type: 'sale' | 'purchase' | 'expense';
  amount: number;
  category: string;
  description?: string;
  created_at: string;
  created_by: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface LoginRequest {
  client_id: string;
  email?: string;
  username?: string;
  password: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'client_user';
  client_id: string;
}

export interface CreateTransactionRequest {
  store_id: string;
  type: 'sale' | 'purchase' | 'expense';
  amount: number;
  category: string;
  description?: string;
}