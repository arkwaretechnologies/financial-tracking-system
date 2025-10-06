import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getExpensesByClient = async (req: Request, res: Response) => {
  const { clientId } = req.params;

  try {
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select(`
        ref_num,
        description,
        paid_to,
        payment_method,
        amount,
        expense_date,
        supp_doc_url,
        stores ( name )
      `)
      .eq('client_id', clientId);

    if (error) {
      throw error;
    }

    // The result from Supabase with a join includes the joined table as a nested object.
    // We need to flatten it to match the original structure.
    const formattedExpenses = expenses.map((expense: any) => {
      const { stores, ...rest } = expense;
      return {
        ...rest,
        store_name: stores ? stores.name : null,
      };
    });

    console.log('Formatted Expenses:', formattedExpenses);

    res.json({ expenses: formattedExpenses });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  const {
    ref_num,
    client_id,
    store_id,
    user_id,
    description,
    paid_to,
    payment_method,
    amount,
    expense_date,
    image_base64,
    image_filename
  } = req.body;

  let supp_doc_url = null;

  try {
    if (image_base64 && image_filename) {
      const fileBuffer = Buffer.from(image_base64, 'base64');
      const filePath = `expenses/${client_id}/${Date.now()}_${image_filename}`;

      const { error: uploadError } = await supabase.storage
        .from('expenses')
        .upload(filePath, fileBuffer, {
          contentType: 'image/png', // Adjust content type as needed
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Storage error: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('expenses')
        .getPublicUrl(filePath);

      if (!urlData) {
        throw new Error('Could not get public URL for the uploaded file.');
      }

      supp_doc_url = urlData.publicUrl;
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert([{
        ref_num,
        client_id,
        store_id,
        user_id,
        description,
        paid_to,
        payment_method,
        amount,
        expense_date,
        supp_doc_url
      }])
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  const { refNum } = req.params;
  const {
    store_id,
    description,
    paid_to,
    payment_method,
    amount,
    expense_date,
  } = req.body;

  try {
    const { data, error } = await supabase
      .from('expenses')
      .update({
        store_id,
        description,
        paid_to,
        payment_method,
        amount,
        expense_date,
      })
      .eq('ref_num', refNum)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  const { refNum } = req.params;

  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('ref_num', refNum);

    if (error) {
      throw error;
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};