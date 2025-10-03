-- Financial Tracking System (FTS) Database Schema
-- This script creates the necessary tables for the FTS application

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'client_user');

-- Create enum for transaction types
CREATE TYPE transaction_type AS ENUM ('sale', 'purchase', 'expense');

-- Create clients table
CREATE TABLE clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stores table
CREATE TABLE stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (with password for Supabase Auth compatibility)
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- This will store hashed passwords
    role user_role NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table
CREATE TABLE sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    payment_method TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    sales_date DATE NOT NULL,
    supporting_docs_path TEXT,
    supporting_docs_bucket TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_client_id ON users(client_id);
CREATE INDEX idx_stores_client_id ON stores(client_id);
CREATE INDEX idx_transactions_store_id ON transactions(store_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Create Row Level Security (RLS) policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Super admin can view all clients" ON clients
    FOR ALL TO authenticated
    USING (true);

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
CREATE POLICY "Users can view users for their client" ON users
    FOR SELECT TO authenticated
    USING (
        client_id = (SELECT client_id FROM users WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
    );

CREATE POLICY "Admins can manage users for their client" ON users
    FOR ALL TO authenticated
    USING (
        client_id = (SELECT client_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')) OR
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

-- Sales policies
CREATE POLICY "Users can view sales for their client" ON sales
    FOR SELECT TO authenticated
    USING (
        client_id = (SELECT client_id FROM users WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
    );

CREATE POLICY "Users can create sales for their client" ON sales
    FOR INSERT TO authenticated
    WITH CHECK (
        client_id = (SELECT client_id FROM users WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Insert default super admin user (password: 'admin123')
INSERT INTO clients (id, name) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'System Admin');

INSERT INTO users (id, email, password, role, client_id) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'superadmin@fts.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', '00000000-0000-0000-0000-000000000001');

-- Insert sample data
INSERT INTO clients (name) VALUES 
    ('Sample Client 1'),
    ('Sample Client 2');

-- Note: You'll need to create stores and users through the API after setup