-- Enhanced Role-Based Access Control Schema for Financial Tracking System
-- This schema implements role-specific passwords and component-level permissions

-- Create enum for different role types
CREATE TYPE role_type AS ENUM (
    'super_admin', 
    'client_admin', 
    'store_manager', 
    'accountant', 
    'cashier', 
    'viewer'
);

-- Create enum for component types that can be accessed
CREATE TYPE component_type AS ENUM (
    'dashboard',
    'transactions',
    'sales',
    'purchases',
    'expenses',
    'reports',
    'clients',
    'stores',
    'users',
    'settings',
    'admin_panel'
);

-- Create enum for access levels
CREATE TYPE access_level AS ENUM ('none', 'read', 'write', 'admin');

-- Enhanced clients table
CREATE TABLE clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
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
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles table - each client can have multiple roles with individual passwords
CREATE TABLE client_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    role_name role_type NOT NULL,
    role_password TEXT NOT NULL, -- Hashed password for this specific role
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID, -- Reference to user who created this role
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, role_name)
);

-- Users table (linked to Supabase Auth)
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    default_role role_type,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-Role assignments (many-to-many relationship)
CREATE TABLE user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES client_roles(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false, -- Is this the user's primary role?
    assigned_by UUID, -- Reference to admin who assigned this role
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional role expiration
    UNIQUE(user_id, role_id)
);

-- Component access permissions table
CREATE TABLE component_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID NOT NULL REFERENCES client_roles(id) ON DELETE CASCADE,
    component component_type NOT NULL,
    access_level access_level NOT NULL DEFAULT 'read',
    restrictions JSONB, -- Optional restrictions (e.g., specific stores, date ranges)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, component)
);

-- Page/Route access table for fine-grained control
CREATE TABLE page_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID NOT NULL REFERENCES client_roles(id) ON DELETE CASCADE,
    page_path TEXT NOT NULL, -- e.g., '/dashboard', '/admin/users'
    can_access BOOLEAN DEFAULT true,
    custom_restrictions JSONB, -- Optional page-specific restrictions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, page_path)
);

-- Session tracking for role-based logins
CREATE TABLE role_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES client_roles(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Audit log for role access
CREATE TABLE role_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES client_roles(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- e.g., 'login', 'access_denied', 'permission_check'
    component component_type,
    page_path TEXT,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced transactions table with role tracking
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_by_role UUID REFERENCES client_roles(id), -- Track which role was used
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_client_roles_client_id ON client_roles(client_id);
CREATE INDEX idx_client_roles_role_name ON client_roles(role_name);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_component_permissions_role_id ON component_permissions(role_id);
CREATE INDEX idx_page_access_role_id ON page_access(role_id);
CREATE INDEX idx_role_sessions_user_id ON role_sessions(user_id);
CREATE INDEX idx_role_sessions_role_id ON role_sessions(role_id);
CREATE INDEX idx_role_audit_log_user_id ON role_audit_log(user_id);
CREATE INDEX idx_role_audit_log_created_at ON role_audit_log(created_at);
CREATE INDEX idx_transactions_created_by_role ON transactions(created_by_role);

-- Row Level Security (RLS) Policies
ALTER TABLE client_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_audit_log ENABLE ROW LEVEL SECURITY;

-- Client Roles policies
CREATE POLICY "Users can view roles for their client" ON client_roles
    FOR SELECT TO authenticated
    USING (
        client_id = (SELECT client_id FROM users WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND default_role = 'super_admin')
    );

CREATE POLICY "Admins can manage roles for their client" ON client_roles
    FOR ALL TO authenticated
    USING (
        client_id = (SELECT client_id FROM users WHERE id = auth.uid() AND default_role IN ('client_admin', 'super_admin')) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND default_role = 'super_admin')
    );

-- User Roles policies
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage user roles for their client" ON user_roles
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = user_roles.user_id 
            AND u.client_id = (SELECT client_id FROM users WHERE id = auth.uid())
            AND (SELECT default_role FROM users WHERE id = auth.uid()) IN ('client_admin', 'super_admin')
        ) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND default_role = 'super_admin')
    );

-- Component Permissions policies
CREATE POLICY "Admins can manage component permissions" ON component_permissions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM client_roles cr
            WHERE cr.id = component_permissions.role_id
            AND cr.client_id = (SELECT client_id FROM users WHERE id = auth.uid())
            AND (SELECT default_role FROM users WHERE id = auth.uid()) IN ('client_admin', 'super_admin')
        ) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND default_role = 'super_admin')
    );

-- Page Access policies
CREATE POLICY "Admins can manage page access" ON page_access
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM client_roles cr
            WHERE cr.id = page_access.role_id
            AND cr.client_id = (SELECT client_id FROM users WHERE id = auth.uid())
            AND (SELECT default_role FROM users WHERE id = auth.uid()) IN ('client_admin', 'super_admin')
        ) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND default_role = 'super_admin')
    );

-- Functions for role-based authentication
CREATE OR REPLACE FUNCTION authenticate_role(
    p_email TEXT,
    p_password TEXT,
    p_role_name role_type
) RETURNS TABLE (
    success BOOLEAN,
    user_id UUID,
    role_id UUID,
    client_id UUID,
    message TEXT
) AS $$
BEGIN
    -- Check if user exists and password matches
    RETURN QUERY
    SELECT 
        CASE 
            WHEN u.id IS NOT NULL AND cr.role_password = crypt(p_password, cr.role_password) THEN true
            ELSE false
        END,
        u.id,
        cr.id,
        u.client_id,
        CASE 
            WHEN u.id IS NULL THEN 'User not found'
            WHEN cr.role_password != crypt(p_password, cr.role_password) THEN 'Invalid role password'
            WHEN NOT u.is_active THEN 'User account is inactive'
            WHEN NOT cr.is_active THEN 'Role is inactive'
            ELSE 'Authentication successful'
        END
    FROM users u
    INNER JOIN client_roles cr ON cr.client_id = u.client_id AND cr.role_name = p_role_name
    WHERE u.email = p_email AND u.is_active = true AND cr.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check component access
CREATE OR REPLACE FUNCTION check_component_access(
    p_user_id UUID,
    p_component component_type,
    p_required_level access_level DEFAULT 'read'
) RETURNS BOOLEAN AS $$
DECLARE
    v_has_access BOOLEAN := false;
    v_user_role RECORD;
BEGIN
    -- Get user's active roles and check permissions
    FOR v_user_role IN
        SELECT ur.role_id, cp.access_level
        FROM user_roles ur
        INNER JOIN client_roles cr ON cr.id = ur.role_id
        INNER JOIN component_permissions cp ON cp.role_id = ur.role_id
        WHERE ur.user_id = p_user_id 
        AND cp.component = p_component
        AND ur.expires_at IS NULL OR ur.expires_at > NOW()
        AND cr.is_active = true
    LOOP
        IF (p_required_level = 'read' AND v_user_role.access_level IN ('read', 'write', 'admin')) OR
           (p_required_level = 'write' AND v_user_role.access_level IN ('write', 'admin')) OR
           (p_required_level = 'admin' AND v_user_role.access_level = 'admin') THEN
            v_has_access := true;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log role access
CREATE OR REPLACE FUNCTION log_role_access(
    p_user_id UUID,
    p_role_id UUID,
    p_action TEXT,
    p_component component_type DEFAULT NULL,
    p_page_path TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO role_audit_log (
        user_id, role_id, action, component, page_path, 
        ip_address, user_agent, success, error_message
    ) VALUES (
        p_user_id, p_role_id, p_action, p_component, p_page_path,
        inet_client_addr(), current_setting('application.user_agent', true),
        p_success, p_error_message
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default roles for system admin client
INSERT INTO clients (id, name, contact_email) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'System Admin', 'admin@fts.com');

-- Insert default super admin role (password: 'superadmin123')
INSERT INTO client_roles (id, client_id, role_name, role_password, description) VALUES 
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'super_admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator with full access');

-- Insert system admin user
INSERT INTO users (id, email, first_name, last_name, client_id, default_role) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'superadmin@fts.com', 'System', 'Administrator', '00000000-0000-0000-0000-000000000001', 'super_admin');

-- Assign super admin role to system admin user
INSERT INTO user_roles (id, user_id, role_id, is_primary, assigned_by) VALUES 
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', true, '00000000-0000-0000-0000-000000000001');

-- Grant full permissions to super admin role
INSERT INTO component_permissions (role_id, component, access_level) VALUES
    ('00000000-0000-0000-0000-000000000001', 'dashboard', 'admin'),
    ('00000000-0000-0000-0000-000000000001', 'transactions', 'admin'),
    ('00000000-0000-0000-0000-000000000001', 'sales', 'admin'),
    ('00000000-0000-0000-0000-000000000001', 'purchases', 'admin'),
    ('00000000-0000-0000-0000-000000000001', 'expenses', 'admin'),
    ('00000000-0000-0000-0000-000000000001', 'reports', 'admin'),
    ('00000000-0000-0000-0000-000000000001', 'clients', 'admin'),
    ('00000000-0000-0000-0000-000000000001', 'stores', 'admin'),
    ('00000000-0000-0000-0000-000000000001', 'users', 'admin'),
    ('00000000-0000-0000-0000-000000000001', 'settings', 'admin'),
    ('00000000-0000-0000-0000-000000000001', 'admin_panel', 'admin');

-- Grant page access to super admin
INSERT INTO page_access (role_id, page_path, can_access) VALUES
    ('00000000-0000-0000-0000-000000000001', '/', true),
    ('00000000-0000-0000-0000-000000000001', '/dashboard', true),
    ('00000000-0000-0000-0000-000000000001', '/admin', true),
    ('00000000-0000-0000-0000-000000000001', '/admin/clients', true),
    ('00000000-0000-0000-0000-000000000001', '/admin/stores', true),
    ('00000000-0000-0000-0000-000000000001', '/admin/users', true),
    ('00000000-0000-0000-0000-000000000001', '/transactions', true),
    ('00000000-0000-0000-0000-000000000001', '/reports', true),
    ('00000000-0000-0000-0000-000000000001', '/settings', true);

-- Create indexes for performance
CREATE INDEX idx_client_roles_client_role ON client_roles(client_id, role_name);
CREATE INDEX idx_user_roles_user_role ON user_roles(user_id, role_id);
CREATE INDEX idx_component_permissions_role_component ON component_permissions(role_id, component);
CREATE INDEX idx_page_access_role_page ON page_access(role_id, page_path);
CREATE INDEX idx_role_sessions_token ON role_sessions(session_token);
CREATE INDEX idx_role_audit_log_user_time ON role_audit_log(user_id, created_at);