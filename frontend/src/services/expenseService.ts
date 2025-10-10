import { api } from '@/lib/api';
import { CreateExpenseRequest, Expense } from '@/lib/api';

export const getExpensesByClient = async (token: string, clientId: string, storeId: string): Promise<Expense[]> => {
  const expenses = await api.getExpenses(token, clientId, storeId);
  return expenses;
};

export const createExpense = async (token: string, data: CreateExpenseRequest): Promise<Expense> => {
  return api.createExpense(token, data);
};