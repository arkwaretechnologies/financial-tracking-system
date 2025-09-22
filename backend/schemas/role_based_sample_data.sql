-- Sample Data for Role-Based Access Control System
-- This demonstrates how to set up roles and permissions for a client

-- Create a sample client
INSERT INTO clients (id, name, contact_email, contact_phone, address) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'ABC Corporation', 'admin@abc-corp.com', '+1234567890', '123 Business St, City, Country');

-- Create sample stores for the client
INSERT INTO stores (id, client_id, name, location, store_code) VALUES 
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Main Store', 'Downtown', 'ABC001'),
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Branch Store', 'Mall', 'ABC002');

-- Create client admin role (password: 'admin123')
INSERT INTO client_roles (id, client_id, role_name, role_password, description) VALUES 
    ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'client_admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Client Administrator - Full access to their organization');

-- Create store manager role (password: 'manager123')
INSERT INTO client_roles (id, client_id, role_name, role_password, description) VALUES 
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'store_manager', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Store Manager - Can manage store operations');

-- Create accountant role (password: 'accountant123')
INSERT INTO client_roles (id, client_id, role_name, role_password, description) VALUES 
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'accountant', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Accountant - Financial operations and reporting');

-- Create cashier role (password: 'cashier123')
INSERT INTO client_roles (id, client_id, role_name, role_password, description) VALUES 
    ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'cashier', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Cashier - Basic sales and transactions');

-- Create viewer role (password: 'viewer123')
INSERT INTO client_roles (id, client_id, role_name, role_password, description) VALUES 
    ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'viewer', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Viewer - Read-only access to reports');

-- Create sample users
INSERT INTO users (id, email, first_name, last_name, phone, client_id, default_role) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'john.smith@abc-corp.com', 'John', 'Smith', '+1234567891', '11111111-1111-1111-1111-111111111111', 'client_admin'),
    ('22222222-2222-2222-2222-222222222222', 'jane.doe@abc-corp.com', 'Jane', 'Doe', '+1234567892', '11111111-1111-1111-1111-111111111111', 'store_manager'),
    ('33333333-3333-3333-3333-333333333333', 'bob.johnson@abc-corp.com', 'Bob', 'Johnson', '+1234567893', '11111111-1111-1111-1111-111111111111', 'accountant'),
    ('44444444-4444-4444-4444-444444444444', 'alice.brown@abc-corp.com', 'Alice', 'Brown', '+1234567894', '11111111-1111-1111-1111-111111111111', 'cashier'),
    ('55555555-5555-5555-5555-555555555555', 'charlie.davis@abc-corp.com', 'Charlie', 'Davis', '+1234567895', '11111111-1111-1111-1111-111111111111', 'viewer');

-- Assign roles to users
INSERT INTO user_roles (id, user_id, role_id, is_primary, assigned_by) VALUES 
    ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', true, '00000000-0000-0000-0000-000000000001'),
    ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', true, '00000000-0000-0000-0000-000000000001'),
    ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', true, '00000000-0000-0000-0000-000000000001'),
    ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', true, '00000000-0000-0000-0000-000000000001'),
    ('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', true, '00000000-0000-0000-0000-000000000001');

-- Component permissions for Client Admin (full access)
INSERT INTO component_permissions (role_id, component, access_level) VALUES
    ('11111111-1111-1111-1111-111111111111', 'dashboard', 'admin'),
    ('11111111-1111-1111-1111-111111111111', 'transactions', 'admin'),
    ('11111111-1111-1111-1111-111111111111', 'sales', 'admin'),
    ('11111111-1111-1111-1111-111111111111', 'purchases', 'admin'),
    ('11111111-1111-1111-1111-111111111111', 'expenses', 'admin'),
    ('11111111-1111-1111-1111-111111111111', 'reports', 'admin'),
    ('11111111-1111-1111-1111-111111111111', 'stores', 'admin'),
    ('11111111-1111-1111-1111-111111111111', 'users', 'admin'),
    ('11111111-1111-1111-1111-111111111111', 'settings', 'admin');

-- Component permissions for Store Manager
INSERT INTO component_permissions (role_id, component, access_level) VALUES
    ('22222222-2222-2222-2222-222222222222', 'dashboard', 'write'),
    ('22222222-2222-2222-2222-222222222222', 'transactions', 'write'),
    ('22222222-2222-2222-2222-222222222222', 'sales', 'write'),
    ('22222222-2222-2222-2222-222222222222', 'purchases', 'write'),
    ('22222222-2222-2222-2222-222222222222', 'expenses', 'write'),
    ('22222222-2222-2222-2222-222222222222', 'reports', 'read'),
    ('22222222-2222-2222-2222-222222222222', 'stores', 'read');

-- Component permissions for Accountant
INSERT INTO component_permissions (role_id, component, access_level) VALUES
    ('33333333-3333-3333-3333-333333333333', 'dashboard', 'read'),
    ('33333333-3333-3333-3333-333333333333', 'transactions', 'write'),
    ('33333333-3333-3333-3333-333333333333', 'sales', 'read'),
    ('33333333-3333-3333-3333-333333333333', 'purchases', 'read'),
    ('33333333-3333-3333-3333-333333333333', 'expenses', 'write'),
    ('33333333-3333-3333-3333-333333333333', 'reports', 'write'),
    ('33333333-3333-3333-3333-333333333333', 'stores', 'read');

-- Component permissions for Cashier
INSERT INTO component_permissions (role_id, component, access_level) VALUES
    ('44444444-4444-4444-4444-444444444444', 'dashboard', 'read'),
    ('44444444-4444-4444-4444-444444444444', 'transactions', 'write'),
    ('44444444-4444-4444-4444-444444444444', 'sales', 'write'),
    ('44444444-4444-4444-4444-444444444444', 'purchases', 'none'),
    ('44444444-4444-4444-4444-444444444444', 'expenses', 'none'),
    ('44444444-4444-4444-4444-444444444444', 'reports', 'read'),
    ('44444444-4444-4444-4444-444444444444', 'stores', 'read');

-- Component permissions for Viewer
INSERT INTO component_permissions (role_id, component, access_level) VALUES
    ('55555555-5555-5555-5555-555555555555', 'dashboard', 'read'),
    ('55555555-5555-5555-5555-555555555555', 'transactions', 'read'),
    ('55555555-5555-5555-5555-555555555555', 'sales', 'read'),
    ('55555555-5555-5555-5555-555555555555', 'purchases', 'read'),
    ('55555555-5555-5555-5555-555555555555', 'expenses', 'read'),
    ('55555555-5555-5555-5555-555555555555', 'reports', 'read'),
    ('55555555-5555-5555-5555-555555555555', 'stores', 'read');

-- Page access permissions
INSERT INTO page_access (role_id, page_path, can_access) VALUES
    -- Client Admin - Full access
    ('11111111-1111-1111-1111-111111111111', '/', true),
    ('11111111-1111-1111-1111-111111111111', '/dashboard', true),
    ('11111111-1111-1111-1111-111111111111', '/transactions', true),
    ('11111111-1111-1111-1111-111111111111', '/reports', true),
    ('11111111-1111-1111-1111-111111111111', '/admin', true),
    ('11111111-1111-1111-1111-111111111111', '/admin/users', true),
    ('11111111-1111-1111-1111-111111111111', '/admin/roles', true),
    ('11111111-1111-1111-1111-111111111111', '/settings', true),
    
    -- Store Manager - Limited admin access
    ('22222222-2222-2222-2222-222222222222', '/', true),
    ('22222222-2222-2222-2222-222222222222', '/dashboard', true),
    ('22222222-2222-2222-2222-222222222222', '/transactions', true),
    ('22222222-2222-2222-2222-222222222222', '/reports', true),
    ('22222222-2222-2222-2222-222222222222', '/admin', true),
    ('22222222-2222-2222-2222-222222222222', '/admin/roles', false),
    
    -- Accountant - Financial focus
    ('33333333-3333-3333-3333-333333333333', '/', true),
    ('33333333-3333-3333-3333-333333333333', '/dashboard', true),
    ('33333333-3333-3333-3333-333333333333', '/transactions', true),
    ('33333333-3333-3333-3333-333333333333', '/reports', true),
    ('33333333-3333-3333-3333-333333333333', '/admin', false),
    
    -- Cashier - Sales focus
    ('44444444-4444-4444-4444-444444444444', '/', true),
    ('44444444-4444-4444-4444-444444444444', '/dashboard', true),
    ('44444444-4444-4444-4444-444444444444', '/transactions', true),
    ('44444444-4444-4444-4444-444444444444', '/reports', true),
    ('44444444-4444-4444-4444-444444444444', '/admin', false),
    
    -- Viewer - Read-only
    ('55555555-5555-5555-5555-555555555555', '/', true),
    ('55555555-5555-5555-5555-555555555555', '/dashboard', true),
    ('55555555-5555-5555-5555-555555555555', '/transactions', true),
    ('55555555-5555-5555-5555-555555555555', '/reports', true),
    ('55555555-5555-5555-5555-555555555555', '/admin', false);

-- Create sample transactions with role tracking
INSERT INTO transactions (id, store_id, type, amount, category, description, created_by, created_by_role) VALUES 
    ('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', 'sale', 150.00, 'Electronics', 'Laptop sale', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
    ('77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 'purchase', 500.00, 'Inventory', 'Office supplies', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222'),
    ('88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', 'expense', 75.00, 'Utilities', 'Electricity bill', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333'),
    ('99999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', 'sale', 200.00, 'Clothing', 'Winter jacket sale', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444');

-- Sample audit log entries
INSERT INTO role_audit_log (user_id, role_id, action, component, page_path, success) VALUES
    ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'login', 'dashboard', '/', true),
    ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'login', 'dashboard', '/', true),
    ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'login', 'dashboard', '/', true),
    ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'login', 'dashboard', '/', true),
    ('55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'login', 'dashboard', '/', true);