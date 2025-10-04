CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id),
    store_id UUID REFERENCES stores(id),
    user_id UUID REFERENCES users(id),
    description TEXT,
    supplier TEXT,
    payment_method TEXT,
    amount NUMERIC NOT NULL,
    category TEXT,
    other_category TEXT,
    purchase_date TIMESTAMPTZ NOT NULL,
    supp_doc_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_purchases_client_id ON purchases(client_id);
CREATE INDEX idx_purchases_store_id ON purchases(store_id);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_purchase_date ON purchases(purchase_date);