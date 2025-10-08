import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getTotalExpenses = async (req: Request, res: Response) => {
    const { clientId, store_id } = req.query;

    if (!clientId) {
        return res.status(400).json({ message: "Client ID is required" });
    }

    try {
        let query = supabase
            .from('expenses')
            .select('amount')
            .eq('client_id', clientId as string);

        if (store_id && store_id !== 'all') {
            query = query.eq('store_id', store_id as string);
        }

        const { data: expenses, error } = await query;

        if (error) {
            console.error('Error fetching total expenses:', error);
            return res.status(500).json({ message: "Error fetching total expenses", details: error.message });
        }

        const totalExpenses = expenses.reduce((acc: number, expense: { amount: number | null }) => acc + (expense.amount || 0), 0);

        res.json({ totalExpenses });
    } catch (error) {
        console.error('Unexpected error in getTotalExpenses:', error);
        res.status(500).json({ message: "Unexpected error occurred", details: (error as Error).message });
    }
};

const fetchTotalExpensesByDate = async (clientId: string, startDate: string, endDate: string, store_id?: string) => {
    let query = supabase
        .from('expenses')
        .select('amount')
        .eq('client_id', clientId)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate);

    if (store_id && store_id !== 'all') {
        query = query.eq('store_id', store_id);
    }

    const { data: expenses, error } = await query;

    if (error) {
        console.error('Error fetching total expenses by date:', error);
        throw new Error("Error fetching total expenses by date");
    }

    const totalExpenses = expenses.reduce((acc: number, expense: { amount: number | null }) => acc + (expense.amount || 0), 0);
    return { totalExpenses };
};

export const getTotalExpensesByDate = async (req: Request, res: Response) => {
    const { clientId, startDate, endDate, store_id } = req.query;

    if (!clientId || !startDate || !endDate) {
        return res.status(400).json({ message: "Client ID, start date, and end date are required" });
    }

    try {
        const totalExpenses = await fetchTotalExpensesByDate(clientId as string, startDate as string, endDate as string, store_id as string);
        res.json(totalExpenses);
    } catch (error) {
        console.error('Unexpected error in getTotalExpensesByDate:', error);
        res.status(500).json({ message: "Unexpected error occurred", details: (error as Error).message });
    }
};

export const getTotalSales = async (req: Request, res: Response) => {
    const { clientId, store_id } = req.query;

    if (!clientId) {
        return res.status(400).json({ message: "Client ID is required" });
    }

    try {
        let query = supabase
            .from('sales')
            .select('amount')
            .eq('client_id', clientId as string);

        if (store_id && store_id !== 'all') {
            query = query.eq('store_id', store_id as string);
        }

        const { data: sales, error } = await query;

        if (error) {
            console.error('Error fetching total sales:', error);
            return res.status(500).json({ message: "Error fetching total sales", details: error.message });
        }

        const totalSales = sales.reduce((acc: number, sale: { amount: number | null }) => acc + (sale.amount || 0), 0);

        res.json({ totalSales });
    } catch (error) {
        console.error('Unexpected error in getTotalSales:', error);
        res.status(500).json({ message: "Unexpected error occurred", details: (error as Error).message });
    }
};

const fetchTotalSalesByDate = async (clientId: string, startDate: string, endDate: string, store_id?: string) => {
    let query = supabase
        .from('sales')
        .select('amount')
        .eq('client_id', clientId)
        .gte('sales_date', startDate)
        .lte('sales_date', endDate);

    if (store_id && store_id !== 'all') {
        query = query.eq('store_id', store_id);
    }

    const { data: sales, error } = await query;

    if (error) {
        console.error('Error fetching total sales by date:', error);
        throw new Error("Error fetching total sales by date");
    }

    const totalSales = sales.reduce((acc: number, sale: { amount: number | null }) => acc + (sale.amount || 0), 0);
    return { totalSales };
};

export const getTotalSalesByDate = async (req: Request, res: Response) => {
    const { clientId, startDate, endDate, store_id } = req.query;

    if (!clientId || !startDate || !endDate) {
        return res.status(400).json({ message: "Client ID, start date, and end date are required" });
    }

    try {
        const totalSales = await fetchTotalSalesByDate(clientId as string, startDate as string, endDate as string, store_id as string);
        res.json(totalSales);
    } catch (error) {
        console.error('Unexpected error in getTotalSalesByDate:', error);
        res.status(500).json({ message: "Unexpected error occurred", details: (error as Error).message });
    }
};

export const getTotalPurchases = async (req: Request, res: Response) => {
    const { clientId, store_id } = req.query;

    if (!clientId) {
        return res.status(400).json({ message: "Client ID is required" });
    }

    try {
        let query = supabase
            .from('purchases')
            .select('amount')
            .eq('client_id', clientId as string);

        if (store_id && store_id !== 'all') {
            query = query.eq('store_id', store_id as string);
        }

        const { data: purchases, error } = await query;

        if (error) {
            console.error('Error fetching total purchases:', error);
            return res.status(500).json({ message: "Error fetching total purchases", details: error.message });
        }

        const totalPurchases = purchases.reduce((acc: number, purchase: { amount: number | null }) => acc + (purchase.amount || 0), 0);

        res.json({ totalPurchases });
    } catch (error) {
        console.error('Unexpected error in getTotalPurchases:', error);
        res.status(500).json({ message: "Unexpected error occurred", details: (error as Error).message });
    }
};

const fetchTotalPurchasesByDate = async (clientId: string, startDate: string, endDate: string, store_id?: string) => {
    let query = supabase
        .from('purchases')
        .select('amount')
        .eq('client_id', clientId)
        .gte('purchase_date', startDate)
        .lte('purchase_date', endDate);

    if (store_id && store_id !== 'all') {
        query = query.eq('store_id', store_id);
    }

    const { data: purchases, error } = await query;

    if (error) {
        console.error('Error fetching total purchases by date:', error);
        throw new Error("Error fetching total purchases by date");
    }

    const totalPurchases = purchases.reduce((acc: number, purchase: { amount: number | null }) => acc + (purchase.amount || 0), 0);
    return { totalPurchases };
};

export const getTotalPurchasesByDate = async (req: Request, res: Response) => {
    const { clientId, startDate, endDate, store_id } = req.query;

    if (!clientId || !startDate || !endDate) {
        return res.status(400).json({ message: "Client ID, start date, and end date are required" });
    }

    try {
        const totalPurchases = await fetchTotalPurchasesByDate(clientId as string, startDate as string, endDate as string, store_id as string);
        res.json(totalPurchases);
    } catch (error) {
        console.error('Unexpected error in getTotalPurchasesByDate:', error);
        res.status(500).json({ message: "Unexpected error occurred", details: (error as Error).message });
    }
};

export const getGrossIncome = async (req: Request, res: Response) => {
    const { clientId, startDate, endDate, store_id } = req.query;

    if (!clientId || !startDate || !endDate) {
        return res.status(400).json({ message: "Client ID, start date, and end date are required" });
    }

    try {
        const { totalSales } = await fetchTotalSalesByDate(clientId as string, startDate as string, endDate as string, store_id as string);
        const { totalPurchases } = await fetchTotalPurchasesByDate(clientId as string, startDate as string, endDate as string, store_id as string);
        const { totalExpenses } = await fetchTotalExpensesByDate(clientId as string, startDate as string, endDate as string, store_id as string);

        const grossIncome = totalSales - totalPurchases - totalExpenses;

        res.json({ 
            grossIncome, 
            totalSales, 
            totalPurchases, 
            totalExpenses 
        });
    } catch (error) {
        console.error('Unexpected error in getGrossIncome:', error);
        res.status(500).json({ message: "Unexpected error occurred", details: (error as Error).message });
    }
};