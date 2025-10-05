    CREATE TABLE expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL REFERENCES clients(id),
        store_id UUID REFERENCES stores(id),
        user_id UUID REFERENCES users(id),
        description TEXT,
        paid_to TEXT,
        payment_method TEXT,
        amount NUMERIC NOT NULL,
        expense_date TIMESTAMPTZ NOT NULL,
        supp_doc_url TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Indexes for performance
    CREATE INDEX idx_expenses_client_id ON expenses(client_id);
    CREATE INDEX idx_expenses_store_id ON expenses(store_id);
    CREATE INDEX idx_expenses_user_id ON expenses(user_id);
    CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);