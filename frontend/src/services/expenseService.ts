import { api } from '@/lib/api';
import { CreateExpenseRequest } from '@/lib/api';

export interface Expense {
  id: string;
  client_id: string;
  store_id: string;
  user_id: string;
  description: string;
  paid_to: string;
  payment_method: 'cash' | 'card' | 'check';
  amount: number;
  expense_date: string;
  supp_doc_url?: string;
  store_name?: string;
}

export const getExpensesByClient = async (token: string, clientId: string): Promise<Expense[]> => {
  const { expenses } = await api.getExpensesByClient(token, clientId);
  return expenses;
};

export const createExpense = async (token: string, data: CreateExpenseRequest): Promise<Expense> => {
  const { expense } = await api.createExpense(token, data);
  return expense;
};