-- Enhanced Financial Tracking System (FTS) Database Schema
-- Updated version with additional fields and improved structure

-- Drop existing tables if they exist (for clean update)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'client_user');

-- Create enum for transaction types
CREATE TYPE transaction_type AS ENUM ('sale', 'purchase', 'expense', 'refund', 'adjustment');

-- Create enum for transaction categories
CREATE TYPE transaction_category AS ENUM ('sales', 'purchases', 'expenses', 'inventory', 'payroll', 'utilities', 'marketing', 'other');

-- Enhanced clients table
CREATE TABLE clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    website TEXT,
    industry TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced stores table
CREATE TABLE stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT,
    store_code TEXT UNIQUE,
    address TEXT,
    phone TEXT,
    email TEXT,
    opening_hours JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- This will store hashed passwords
    role user_role NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced transactions table
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    category transaction_category NOT NULL,
    subcategory TEXT,
    description TEXT,
    reference_number TEXT,
    payment_method TEXT,
    tax_amount NUMERIC(10, 2) DEFAULT 0,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transaction items table for detailed line items
CREATE TABLE transaction_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    tax_rate NUMERIC(5, 2) DEFAULT 0,
    discount_rate NUMERIC(5, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit log table
CREATE TABLE audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user sessions table
CREATE TABLE user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create password reset tokens table
CREATE TABLE password_reset_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_client_id ON users(client_id);
CREATE INDEX idx_users_store_id ON users(store_id);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_stores_client_id ON stores(client_id);
CREATE INDEX idx_stores_store_code ON stores(store_code);
CREATE INDEX idx_stores_is_active ON stores(is_active);
CREATE INDEX idx_transactions_store_id ON transactions(store_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_created_by ON transactions(created_by);
CREATE INDEX idx_transactions_transaction_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values)
        VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, old_values)
        VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, new_values)
        VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers
CREATE TRIGGER audit_clients AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_stores AFTER INSERT OR UPDATE OR DELETE ON stores
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_transactions AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create Row Level Security (RLS) policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Sales table for recording store sales
CREATE TABLE sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    payment_method TEXT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    sales_date DATE NOT NULL,
    supporting_docs_bucket TEXT
);

-- Enable Row Level Security (RLS) for sales
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Sales table policies
CREATE POLICY "Users can view sales for their client" ON sales
    FOR SELECT TO authenticated
    USING (
        client_id = (SELECT client_id FROM users WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
    );

CREATE POLICY "Users can create sales for their client" ON sales
    FOR INSERT TO authenticated
    WITH CHECK (
        (
            store_id IS NULL AND
            client_id = (SELECT client_id FROM users WHERE id = auth.uid())
        ) OR EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = sales.store_id 
            AND stores.client_id = (SELECT client_id FROM users WHERE id = auth.uid())
        ) OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Helpful indexes
CREATE INDEX idx_sales_client_id ON sales(client_id);
CREATE INDEX idx_sales_store_id ON sales(store_id);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_sales_date ON sales(sales_date);

-- Create storage bucket for sales pictures
SELECT storage.create_bucket(
    'sales',
    public := false,
    file_size_limit := 5242880, -- 5 MB
    allowed_mime_types := ARRAY['image/png', 'image/jpeg', 'image/webp']
);

-- Storage policies for sales bucket
-- Only allow authenticated users; super_admins can view all, users can access their own objects
CREATE POLICY "Sales pictures - view own or super admin" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'sales' AND (
            owner = auth.uid() OR EXISTS (
                SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'
            )
        )
    );

CREATE POLICY "Sales pictures - upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'sales' AND owner = auth.uid()
    );

CREATE POLICY "Sales pictures - update own" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'sales' AND owner = auth.uid()
    );

CREATE POLICY "Sales pictures - delete own" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'sales' AND owner = auth.uid()
    );


-- Clients policies
CREATE POLICY "Super admin can view all clients" ON clients
    FOR ALL TO authenticated
    USING (true);

CREATE POLICY "Users can view their client" ON clients
    FOR SELECT TO authenticated
    USING (
        id = (SELECT client_id FROM users WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Stores policies
CREATE POLICY "Users can view stores for their client" ON stores
    FOR SELECT TO authenticated
    USING (
        client_id = (SELECT client_id FROM users WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
    );

CREATE POLICY "Admins can manage stores for their client" ON stores
    FOR ALL TO authenticated
    USING (
        client_id = (SELECT client_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT TO authenticated
    USING (
        id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() 
            AND u.role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can view users for their client" ON users
    FOR SELECT TO authenticated
    USING (
        client_id = (SELECT client_id FROM users WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
    );

CREATE POLICY "Admins can manage users for their client" ON users
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
            AND u.client_id = users.client_id
        ) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Transactions policies
CREATE POLICY "Users can view transactions for their stores" ON transactions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = transactions.store_id 
            AND stores.client_id = (SELECT client_id FROM users WHERE id = auth.uid())
        ) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
    );

CREATE POLICY "Users can create transactions for their stores" ON transactions
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = transactions.store_id 
            AND stores.client_id = (SELECT client_id FROM users WHERE id = auth.uid())
        ) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Transaction items policies
CREATE POLICY "Users can view transaction items for their transactions" ON transaction_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM transactions 
            JOIN stores ON stores.id = transactions.store_id
            WHERE transactions.id = transaction_items.transaction_id 
            AND stores.client_id = (SELECT client_id FROM users WHERE id = auth.uid())
        ) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Audit log policies
CREATE POLICY "Super admin can view audit logs" ON audit_log
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));

-- User sessions policies
CREATE POLICY "Users can manage their own sessions" ON user_sessions
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

-- Password reset tokens policies
CREATE POLICY "Users can create reset tokens for themselves" ON password_reset_tokens
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid()
    );

-- Insert default super admin user (password: 'admin123')
INSERT INTO clients (id, name, contact_email, contact_phone, address) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'System Admin', 'admin@fts.com', '+1234567890', 'System Administration');

INSERT INTO users (id, username, email, password, role, first_name, last_name, client_id, is_active) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'superadmin', 'superadmin@fts.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', 'System', 'Administrator', '00000000-0000-0000-0000-000000000001', true);

-- Insert sample clients
INSERT INTO clients (name, contact_email, contact_phone, address, industry) VALUES 
    ('Sample Client 1', 'contact@client1.com', '+1234567891', '123 Business St, City', 'Retail'),
    ('Sample Client 2', 'contact@client2.com', '+1234567892', '456 Commerce Ave, Town', 'Restaurant');

-- Insert sample stores
INSERT INTO stores (client_id, name, location, store_code, address, phone, email, opening_hours) VALUES 
    ((SELECT id FROM clients WHERE name = 'Sample Client 1'), 'Main Store', 'Downtown', 'C001', '123 Business St, City', '+1234567893', 'store1@client1.com', '{"mon-fri": "9:00-18:00", "sat": "10:00-16:00", "sun": "closed"}'),
    ((SELECT id FROM clients WHERE name = 'Sample Client 1'), 'Branch Store', 'Mall', 'C002', '789 Mall Rd, City', '+1234567894', 'store2@client1.com', '{"mon-sun": "10:00-21:00"}'),
    ((SELECT id FROM clients WHERE name = 'Sample Client 2'), 'Restaurant Location', 'City Center', 'R001', '456 Commerce Ave, Town', '+1234567895', 'restaurant@client2.com', '{"mon-thu": "11:00-22:00", "fri-sat": "11:00-23:00", "sun": "12:00-21:00"}');

-- Insert sample users
INSERT INTO users (username, email, password, role, first_name, last_name, client_id, store_id, is_active) VALUES 
    ('admin1', 'admin@client1.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'John', 'Admin', (SELECT id FROM clients WHERE name = 'Sample Client 1'), (SELECT id FROM stores WHERE store_code = 'C001'), true),
    ('user1', 'user@client1.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client_user', 'Jane', 'User', (SELECT id FROM clients WHERE name = 'Sample Client 1'), (SELECT id FROM stores WHERE store_code = 'C002'), true),
    ('manager1', 'manager@client2.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Bob', 'Manager', (SELECT id FROM clients WHERE name = 'Sample Client 2'), (SELECT id FROM stores WHERE store_code = 'R001'), true);

-- Insert sample transactions
INSERT INTO transactions (store_id, type, amount, category, subcategory, description, reference_number, payment_method, tax_amount, discount_amount, created_by, transaction_date) VALUES 
    ((SELECT id FROM stores WHERE store_code = 'C001'), 'sale', 150.00, 'sales', 'electronics', 'Laptop sale', 'TXN001', 'credit_card', 12.00, 0.00, (SELECT id FROM users WHERE username = 'user1'), CURRENT_DATE - INTERVAL '2 days'),
    ((SELECT id FROM stores WHERE store_code = 'C002'), 'sale', 75.50, 'sales', 'clothing', 'Winter jacket', 'TXN002', 'cash', 6.04, 5.00, (SELECT id FROM users WHERE username = 'user1'), CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM stores WHERE store_code = 'R001'), 'expense', 500.00, 'expenses', 'inventory', 'Food supplies', 'EXP001', 'bank_transfer', 0.00, 0.00, (SELECT id FROM users WHERE username = 'manager1'), CURRENT_DATE),
    ((SELECT id FROM stores WHERE store_code = 'C001'), 'purchase', 1200.00, 'purchases', 'electronics', 'Inventory restock', 'PUR001', 'bank_transfer', 96.00, 0.00, (SELECT id FROM users WHERE username = 'admin1'), CURRENT_DATE - INTERVAL '3 days');

-- Insert sample transaction items
INSERT INTO transaction_items (transaction_id, item_name, quantity, unit_price, total_price, tax_rate, discount_rate) VALUES 
    ((SELECT id FROM transactions WHERE reference_number = 'TXN001'), 'Dell Laptop', 1, 150.00, 150.00, 8.0, 0.0),
    ((SELECT id FROM transactions WHERE reference_number = 'TXN002'), 'Winter Jacket', 1, 75.50, 75.50, 8.0, 5.0),
    ((SELECT id FROM transactions WHERE reference_number = 'EXP001'), 'Fresh Produce', 50, 10.00, 500.00, 0.0, 0.0),
    ((SELECT id FROM transactions WHERE reference_number = 'PUR001'), 'Smartphone', 10, 120.00, 1200.00, 8.0, 0.0);

-- Note: Enhanced schema includes audit logging, session management, and password reset functionality