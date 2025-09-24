-- Role-Based Page Access Control Schema
-- This schema defines comprehensive role-based access control for pages and components

-- Drop existing types and dependent objects first
DROP TRIGGER IF EXISTS update_system_roles_updated_at ON system_roles;
DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;
DROP TRIGGER IF EXISTS update_role_page_access_updated_at ON role_page_access;
DROP TRIGGER IF EXISTS update_component_permissions_updated_at ON component_permissions;
DROP TRIGGER IF EXISTS update_user_role_assignments_updated_at ON user_role_assignments;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS check_user_page_access(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS get_user_accessible_pages(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_client_role(UUID, VARCHAR, system_role_type, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS assign_role_page_permissions(UUID, JSONB, UUID) CASCADE;
DROP FUNCTION IF EXISTS update_client_role(UUID, VARCHAR, TEXT, BOOLEAN, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_client_roles_with_permissions(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS log_role_access(UUID, UUID, VARCHAR, JSONB) CASCADE;

DROP POLICY IF EXISTS "System roles are viewable by authenticated users" ON system_roles;
DROP POLICY IF EXISTS "Clients can view their own roles" ON system_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON system_roles;
DROP POLICY IF EXISTS "Client admins can manage their client roles" ON system_roles;
DROP POLICY IF EXISTS "Super admin can manage all roles" ON system_roles;
DROP POLICY IF EXISTS "Users can view their assigned roles" ON system_roles;

DROP POLICY IF EXISTS "All authenticated users can view active pages" ON pages;
DROP POLICY IF EXISTS "Role page access are viewable by authenticated users" ON role_page_access;
DROP POLICY IF EXISTS "Super admins can manage all role page access" ON role_page_access;
DROP POLICY IF EXISTS "Client admins can manage their client role page access" ON role_page_access;
DROP POLICY IF EXISTS "Super admin can manage component permissions" ON component_permissions;
DROP POLICY IF EXISTS "Users can view their own role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Admins can manage role assignments for their client" ON user_role_assignments;
DROP POLICY IF EXISTS "Super admin can view role audit logs" ON role_audit_log;

DROP TABLE IF EXISTS role_audit_log CASCADE;
DROP TABLE IF EXISTS role_hierarchy CASCADE;
DROP TABLE IF EXISTS user_role_assignments CASCADE;
DROP TABLE IF EXISTS component_permissions CASCADE;
DROP TABLE IF EXISTS role_page_access CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS system_roles CASCADE;

DROP TYPE IF EXISTS access_level CASCADE;
DROP TYPE IF EXISTS system_role_type CASCADE;

-- Create enum for access levels
CREATE TYPE access_level AS ENUM ('none', 'read', 'write', 'admin');

-- Create enum for role types (extends existing user_role)
CREATE TYPE system_role_type AS ENUM ('super_admin', 'client_admin', 'store_manager', 'accountant', 'cashier', 'viewer');

-- Create roles table for system roles with client-specific support
CREATE TABLE system_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    role_type system_role_type NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- NULL for system-wide roles
    description TEXT,
    is_system_role BOOLEAN DEFAULT false, -- true for built-in system roles, false for client-created
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id), -- User who created this role
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, client_id) -- Allow same role name across different clients, but not within same client
);

-- Update users table to integrate with system roles
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS system_role_id UUID REFERENCES system_roles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS role_type system_role_type, -- New role type from system_role_type enum
ADD COLUMN IF NOT EXISTS is_role_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS role_assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS role_assigned_by UUID REFERENCES users(id);



-- Create pages table to define all available pages in the system
CREATE TABLE pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_key VARCHAR(100) UNIQUE NOT NULL,
    page_name VARCHAR(200) NOT NULL,
    page_group VARCHAR(100), -- e.g., 'Dashboard', 'Transactions', 'Users'
    description TEXT,
    route_path VARCHAR(255),
    icon_name VARCHAR(100), -- For UI icons
    sort_order INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_page_access table - the main access control matrix
CREATE TABLE role_page_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    access_level access_level NOT NULL DEFAULT 'none',
    can_create BOOLEAN DEFAULT false,
    can_read BOOLEAN DEFAULT false,
    can_update BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_export BOOLEAN DEFAULT false,
    can_import BOOLEAN DEFAULT false,
    restrictions JSONB DEFAULT '{}', -- JSON for specific restrictions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, page_id) -- Ensure one entry per role-page combination
);

-- Create component_permissions table for granular component-level access
CREATE TABLE component_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    component_name VARCHAR(200) NOT NULL,
    component_key VARCHAR(100) NOT NULL,
    access_level access_level NOT NULL DEFAULT 'none',
    is_visible BOOLEAN DEFAULT true,
    is_enabled BOOLEAN DEFAULT true,
    restrictions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, page_id, component_key)
);

-- Create user_role_assignments table to assign roles to users
CREATE TABLE user_role_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES users(id),
    is_primary BOOLEAN DEFAULT false, -- Primary role for the user
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_id) -- Prevent duplicate role assignments
);

-- Create role_hierarchy table for role inheritance
CREATE TABLE role_hierarchy (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_role_id UUID NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE,
    child_role_id UUID NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE,
    inheritance_type VARCHAR(50) DEFAULT 'full', -- 'full', 'partial', 'custom'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_role_id, child_role_id)
);

-- Create audit_log table extension for role changes
CREATE TABLE role_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES system_roles(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'role_assigned', 'role_removed', 'permission_changed'
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_system_roles_role_type;
DROP INDEX IF EXISTS idx_system_roles_client_id;
DROP INDEX IF EXISTS idx_system_roles_is_system_role;
DROP INDEX IF EXISTS idx_system_roles_is_active;
DROP INDEX IF EXISTS idx_system_roles_created_by;
DROP INDEX IF EXISTS idx_pages_page_group;
DROP INDEX IF EXISTS idx_pages_is_active;
DROP INDEX IF EXISTS idx_role_page_access_role_id;
DROP INDEX IF EXISTS idx_role_page_access_page_id;
DROP INDEX IF EXISTS idx_role_page_access_access_level;
DROP INDEX IF EXISTS idx_component_permissions_role_id;
DROP INDEX IF EXISTS idx_component_permissions_page_id;
DROP INDEX IF EXISTS idx_user_role_assignments_user_id;
DROP INDEX IF EXISTS idx_user_role_assignments_role_id;
DROP INDEX IF EXISTS idx_user_role_assignments_client_id;
DROP INDEX IF EXISTS idx_role_hierarchy_parent_role_id;
DROP INDEX IF EXISTS idx_role_hierarchy_child_role_id;
DROP INDEX IF EXISTS idx_role_audit_log_role_id;
DROP INDEX IF EXISTS idx_role_audit_log_user_id;
DROP INDEX IF EXISTS idx_role_audit_log_action;
DROP INDEX IF EXISTS idx_role_audit_log_created_at;

-- Create indexes for performance
CREATE INDEX idx_system_roles_role_type ON system_roles(role_type);
CREATE INDEX idx_system_roles_client_id ON system_roles(client_id);
CREATE INDEX idx_system_roles_is_system_role ON system_roles(is_system_role);
CREATE INDEX idx_system_roles_is_active ON system_roles(is_active);
CREATE INDEX idx_system_roles_created_by ON system_roles(created_by);
CREATE INDEX idx_pages_page_group ON pages(page_group);
CREATE INDEX idx_pages_is_active ON pages(is_active);
CREATE INDEX idx_role_page_access_role_id ON role_page_access(role_id);
CREATE INDEX idx_role_page_access_page_id ON role_page_access(page_id);
CREATE INDEX idx_role_page_access_level ON role_page_access(access_level);
CREATE INDEX idx_component_permissions_role_id ON component_permissions(role_id);
CREATE INDEX idx_component_permissions_page_id ON component_permissions(page_id);
CREATE INDEX idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX idx_user_role_assignments_role_id ON user_role_assignments(role_id);
CREATE INDEX idx_user_role_assignments_is_primary ON user_role_assignments(is_primary);
CREATE INDEX idx_role_hierarchy_parent_id ON role_hierarchy(parent_role_id);
CREATE INDEX idx_role_hierarchy_child_id ON role_hierarchy(child_role_id);
CREATE INDEX idx_role_audit_log_user_id ON role_audit_log(user_id);
CREATE INDEX idx_role_audit_log_role_id ON role_audit_log(role_id);
CREATE INDEX idx_role_audit_log_created_at ON role_audit_log(created_at);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_system_roles_updated_at BEFORE UPDATE ON system_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_page_access_updated_at BEFORE UPDATE ON role_page_access
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_component_permissions_updated_at BEFORE UPDATE ON component_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_role_assignments_updated_at BEFORE UPDATE ON user_role_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system roles (system-wide, not client-specific)
INSERT INTO system_roles (name, role_type, description, is_system_role) VALUES 
    ('Super Administrator', 'super_admin', 'Full system access with all permissions', true),
    ('Client Administrator', 'client_admin', 'Client-level administration with user management', true),
    ('Store Manager', 'store_manager', 'Store management with transaction and inventory access', true),
    ('Accountant', 'accountant', 'Financial data access with reporting capabilities', true),
    ('Cashier', 'cashier', 'Point of sale and basic transaction access', true),
    ('Viewer', 'viewer', 'Read-only access to assigned data', true);

-- Insert default pages
INSERT INTO pages (page_key, page_name, page_group, description, route_path, icon_name, sort_order) VALUES 
    -- Dashboard Pages
    ('dashboard', 'Dashboard', 'Dashboard', 'Main dashboard with overview', '/dashboard', 'dashboard', 10),
    ('dashboard_analytics', 'Analytics Dashboard', 'Dashboard', 'Advanced analytics and reporting', '/dashboard/analytics', 'analytics', 20),
    
    -- User Management Pages
    ('users', 'User Management', 'Users & Roles', 'Manage system users', '/dashboard/users', 'users', 30),
    ('roles', 'Role Management', 'Users & Roles', 'Manage user roles and permissions', '/dashboard/roles', 'shield', 40),
    ('user_profile', 'User Profile', 'Users & Roles', 'User profile management', '/dashboard/profile', 'user', 50),
    
    -- Transaction Pages
    ('transactions', 'Transactions', 'Transactions', 'View and manage transactions', '/dashboard/transactions', 'transactions', 60),
    ('transaction_create', 'Create Transaction', 'Transactions', 'Create new transactions', '/dashboard/transactions/create', 'plus', 70),
    ('transaction_import', 'Import Transactions', 'Transactions', 'Import transactions from files', '/dashboard/transactions/import', 'upload', 80),
    
    -- Store Management Pages
    ('stores', 'Store Management', 'Stores', 'Manage store locations', '/dashboard/stores', 'store', 90),
    ('store_settings', 'Store Settings', 'Stores', 'Configure store settings', '/dashboard/stores/settings', 'settings', 100),
    
    -- Client Management Pages
    ('clients', 'Client Management', 'Clients', 'Manage client organizations', '/dashboard/clients', 'building', 110),
    ('client_settings', 'Client Settings', 'Clients', 'Configure client settings', '/dashboard/clients/settings', 'cog', 120),
    
    -- Reports Pages
    ('reports', 'Reports', 'Reports', 'Generate and view reports', '/dashboard/reports', 'report', 130),
    ('financial_reports', 'Financial Reports', 'Reports', 'Financial analysis reports', '/dashboard/reports/financial', 'chart', 140),
    ('audit_logs', 'Audit Logs', 'Reports', 'System audit logs', '/dashboard/reports/audit', 'history', 150),
    
    -- System Administration Pages
    ('system_settings', 'System Settings', 'Administration', 'System-wide settings', '/dashboard/admin/settings', 'settings', 160),
    ('system_health', 'System Health', 'Administration', 'System monitoring and health', '/dashboard/admin/health', 'heart', 170),
    ('api_docs', 'API Documentation', 'Administration', 'API documentation and testing', '/dashboard/admin/api', 'code', 180);

-- Insert default role-page access permissions (Role Access Matrix)
-- Super Administrator - Full access to everything
INSERT INTO role_page_access (role_id, page_id, access_level, can_create, can_read, can_update, can_delete, can_export, can_import) 
SELECT sr.id, p.id, 'admin', true, true, true, true, true, true
FROM system_roles sr, pages p 
WHERE sr.role_type = 'super_admin';

-- Client Administrator - Full access to most pages except system admin
INSERT INTO role_page_access (role_id, page_id, access_level, can_create, can_read, can_update, can_delete, can_export, can_import) 
SELECT sr.id, p.id, 'admin', true, true, true, true, true, true
FROM system_roles sr, pages p 
WHERE sr.role_type = 'client_admin' 
AND p.page_key NOT IN ('system_settings', 'system_health', 'api_docs');

-- Store Manager - Limited access to store-related functions
INSERT INTO role_page_access (role_id, page_id, access_level, can_create, can_read, can_update, can_delete, can_export, can_import) 
SELECT sr.id, p.id, 
    CASE 
        WHEN p.page_group IN ('Dashboard', 'Transactions', 'Stores') THEN 'write'::access_level
        WHEN p.page_group IN ('Reports') THEN 'read'::access_level
        ELSE 'none'::access_level
    END,
    CASE WHEN p.page_group IN ('Transactions') THEN true ELSE false END,
    CASE WHEN p.page_group IN ('Dashboard', 'Transactions', 'Stores', 'Reports') THEN true ELSE false END,
    CASE WHEN p.page_group IN ('Transactions', 'Stores') THEN true ELSE false END,
    CASE WHEN p.page_group IN ('Transactions') THEN true ELSE false END,
    CASE WHEN p.page_group IN ('Reports') THEN true ELSE false END,
    CASE WHEN p.page_group IN ('Transactions') THEN true ELSE false END
FROM system_roles sr, pages p 
WHERE sr.role_type = 'store_manager' 
AND p.page_group IN ('Dashboard', 'Transactions', 'Stores', 'Reports');

-- Accountant - Read access to financial data
INSERT INTO role_page_access (role_id, page_id, access_level, can_create, can_read, can_update, can_delete, can_export, can_import) 
SELECT sr.id, p.id, 
    CASE 
        WHEN p.page_group IN ('Dashboard', 'Reports') THEN 'read'::access_level
        WHEN p.page_key IN ('transactions', 'financial_reports') THEN 'write'::access_level
        ELSE 'none'::access_level
    END,
    false,
    CASE WHEN p.page_group IN ('Dashboard', 'Reports') OR p.page_key IN ('transactions', 'financial_reports') THEN true ELSE false END,
    CASE WHEN p.page_key IN ('transactions', 'financial_reports') THEN true ELSE false END,
    false,
    CASE WHEN p.page_group IN ('Reports') OR p.page_key IN ('financial_reports') THEN true ELSE false END,
    CASE WHEN p.page_key IN ('transactions', 'transaction_import') THEN true ELSE false END
FROM system_roles sr, pages p 
WHERE sr.role_type = 'accountant' 
AND (p.page_group IN ('Dashboard', 'Reports') OR p.page_key IN ('transactions', 'financial_reports'));

-- Cashier - Basic POS and transaction access
INSERT INTO role_page_access (role_id, page_id, access_level, can_create, can_read, can_update, can_delete, can_export, can_import) 
SELECT sr.id, p.id, 
    CASE 
        WHEN p.page_key IN ('dashboard', 'transactions', 'transaction_create') THEN 'write'::access_level
        WHEN p.page_key IN ('user_profile') THEN 'read'::access_level
        ELSE 'none'::access_level
    END,
    CASE WHEN p.page_key IN ('transaction_create') THEN true ELSE false END,
    CASE WHEN p.page_key IN ('dashboard', 'transactions', 'transaction_create', 'user_profile') THEN true ELSE false END,
    CASE WHEN p.page_key IN ('transactions') THEN true ELSE false END,
    false,
    false,
    false
FROM system_roles sr, pages p 
WHERE sr.role_type = 'cashier' 
AND p.page_key IN ('dashboard', 'transactions', 'transaction_create', 'user_profile');

-- Viewer - Read-only access to basic pages
INSERT INTO role_page_access (role_id, page_id, access_level, can_create, can_read, can_update, can_delete, can_export, can_import) 
SELECT sr.id, p.id, 'read', false, true, false, false, true, false
FROM system_roles sr, pages p 
WHERE sr.role_type = 'viewer' 
AND p.page_group IN ('Dashboard', 'Reports')
AND p.page_key NOT IN ('audit_logs');

-- RLS Policies
ALTER TABLE system_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_page_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_audit_log ENABLE ROW LEVEL SECURITY;

-- System roles RLS policies
CREATE POLICY "System roles are viewable by authenticated users" ON system_roles FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Clients can view their own roles" ON system_roles FOR SELECT
    USING (
        client_id IS NULL OR -- System-wide roles are visible to all
        client_id IN (
            SELECT client_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Super admins can manage all roles" ON system_roles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN system_roles admin_sr ON ura.role_id = admin_sr.id
            WHERE ura.user_id = auth.uid() 
            AND admin_sr.role_type = 'super_admin'
            AND ura.is_active = true
        )
    );

CREATE POLICY "Client admins can manage their client roles" ON system_roles FOR ALL
    USING (
        client_id IN (
            SELECT client_id FROM users WHERE id = auth.uid()
        ) AND
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN system_roles admin_sr ON ura.role_id = admin_sr.id
            WHERE ura.user_id = auth.uid() 
            AND admin_sr.role_type = 'client_admin'
            AND ura.is_active = true
            AND admin_sr.client_id = system_roles.client_id
        )
    );

-- System roles policies
CREATE POLICY "Super admin can manage all roles" ON system_roles
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Users can view active roles" ON system_roles
    FOR SELECT TO authenticated
    USING (is_active = true);

-- Pages policies
CREATE POLICY "All authenticated users can view active pages" ON pages
    FOR SELECT TO authenticated
    USING (is_active = true);

-- Role page access policies
CREATE POLICY "Role page access are viewable by authenticated users" ON role_page_access FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can manage all role page access" ON role_page_access FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN system_roles admin_sr ON ura.role_id = admin_sr.id
            WHERE ura.user_id = auth.uid() 
            AND admin_sr.role_type = 'super_admin'
            AND ura.is_active = true
        )
    );

CREATE POLICY "Client admins can manage their client role page access" ON role_page_access FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN system_roles sr ON ura.role_id = sr.id
            JOIN system_roles target_sr ON target_sr.id = role_page_access.role_id
            WHERE ura.user_id = auth.uid() 
            AND sr.role_type = 'client_admin'
            AND ura.is_active = true
            AND sr.client_id = target_sr.client_id
        )
    );

-- Component permissions policies
CREATE POLICY "Super admin can manage component permissions" ON component_permissions
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));

-- User role assignments policies
CREATE POLICY "Users can view their own role assignments" ON user_role_assignments
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage role assignments for their client" ON user_role_assignments
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() 
            AND u.role IN ('super_admin', 'admin')
            AND (
                u.role = 'super_admin' OR
                EXISTS (
                    SELECT 1 FROM users target_user
                    WHERE target_user.id = user_role_assignments.user_id
                    AND target_user.client_id = u.client_id
                )
            )
        )
    );

-- Role audit log policies
CREATE POLICY "Super admin can view role audit logs" ON role_audit_log
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));

-- Create function to check user page access
CREATE OR REPLACE FUNCTION check_user_page_access(
    p_user_id UUID,
    p_page_key VARCHAR
)
RETURNS TABLE (
    has_access BOOLEAN,
    access_level access_level,
    can_create BOOLEAN,
    can_read BOOLEAN,
    can_update BOOLEAN,
    can_delete BOOLEAN,
    can_export BOOLEAN,
    can_import BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN rpa.access_level != 'none' THEN true 
            ELSE false 
        END,
        COALESCE(rpa.access_level, 'none'),
        COALESCE(rpa.can_create, false),
        COALESCE(rpa.can_read, false),
        COALESCE(rpa.can_update, false),
        COALESCE(rpa.can_delete, false),
        COALESCE(rpa.can_export, false),
        COALESCE(rpa.can_import, false)
    FROM users u
    JOIN user_role_assignments ura ON ura.user_id = u.id AND ura.is_active = true
    JOIN system_roles sr ON sr.id = ura.role_id AND sr.is_active = true
    JOIN role_page_access rpa ON rpa.role_id = sr.id
    JOIN pages p ON p.id = rpa.page_id AND p.is_active = true
    WHERE u.id = p_user_id 
    AND p.page_key = p_page_key
    AND u.is_active = true
    ORDER BY 
        CASE rpa.access_level 
            WHEN 'admin' THEN 1 
            WHEN 'write' THEN 2 
            WHEN 'read' THEN 3 
            ELSE 4 
        END
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role details with system role information
CREATE OR REPLACE FUNCTION get_user_role_details(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    email VARCHAR,
    role_name VARCHAR,
    role_type system_role_type,
    role_description TEXT,
    is_primary BOOLEAN,
    is_active BOOLEAN,
    client_id UUID,
    client_name VARCHAR,
    role_assigned_at TIMESTAMP WITH TIME ZONE,
    role_assigned_by_email VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        sr.name,
        sr.role_type,
        sr.description,
        ura.is_primary,
        ura.is_active,
        c.id,
        c.name,
        ura.created_at,
        assignor.email
    FROM users u
    LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.is_active = true
    LEFT JOIN system_roles sr ON ura.role_id = sr.id
    LEFT JOIN clients c ON sr.client_id = c.id
    LEFT JOIN users assignor ON ura.assigned_by = assignor.id
    WHERE u.id = p_user_id
    ORDER BY ura.is_primary DESC, ura.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign system role to user
CREATE OR REPLACE FUNCTION assign_system_role_to_user(
    p_target_user_id UUID,
    p_role_id UUID,
    p_assigned_by UUID,
    p_is_primary BOOLEAN DEFAULT false
) RETURNS VOID AS $$
DECLARE
    v_role_client_id UUID;
    v_user_client_id UUID;
    v_assignor_role_type system_role_type;
BEGIN
    -- Get role and user client information
    SELECT sr.client_id, u.client_id INTO v_role_client_id, v_user_client_id
    FROM system_roles sr
    CROSS JOIN users u
    WHERE sr.id = p_role_id AND u.id = p_target_user_id;
    
    -- Get assignor's role type
    SELECT sr.role_type INTO v_assignor_role_type
    FROM user_role_assignments ura
    JOIN system_roles sr ON ura.role_id = sr.id
    WHERE ura.user_id = p_assigned_by AND ura.is_active = true
    ORDER BY ura.is_primary DESC
    LIMIT 1;
    
    -- Permission checks
    IF v_assignor_role_type != 'super_admin' THEN
        -- Check if assignor has permission to assign this role
        IF NOT EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN system_roles sr ON ura.role_id = sr.id
            WHERE ura.user_id = p_assigned_by AND ura.is_active = true
            AND (
                (sr.role_type = 'client_admin' AND sr.client_id = v_role_client_id) OR
                (sr.role_type = 'super_admin')
            )
        ) THEN
            RAISE EXCEPTION 'Insufficient permissions to assign this role';
        END IF;
        
        -- Ensure user and role belong to same client (for non-super-admin roles)
        IF v_role_client_id IS NOT NULL AND v_user_client_id != v_role_client_id THEN
            RAISE EXCEPTION 'Cannot assign client-specific role to user from different client';
        END IF;
    END IF;
    
    -- Deactivate existing primary role if setting new primary
    IF p_is_primary THEN
        UPDATE user_role_assignments 
        SET is_primary = false, updated_at = NOW()
        WHERE user_id = p_target_user_id AND is_primary = true;
    END IF;
    
    -- Insert or update role assignment
    INSERT INTO user_role_assignments (user_id, role_id, assigned_by, is_primary, is_active)
    VALUES (p_target_user_id, p_role_id, p_assigned_by, p_is_primary, true)
    ON CONFLICT (user_id, role_id) 
    DO UPDATE SET 
        is_primary = EXCLUDED.is_primary,
        is_active = true,
        updated_at = NOW();
    
    -- Update user's system_role_id if this is primary role
    IF p_is_primary THEN
        UPDATE users 
        SET system_role_id = p_role_id, 
            role_type = (SELECT role_type FROM system_roles WHERE id = p_role_id),
            role_assigned_at = NOW(),
            role_assigned_by = p_assigned_by
        WHERE id = p_target_user_id;
    END IF;
    
    -- Log the role assignment
    PERFORM log_role_access(p_assigned_by, p_role_id, 'role_assigned', 
        jsonb_build_object('target_user_id', p_target_user_id, 'is_primary', p_is_primary));
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users FOR SELECT
    USING (auth.uid() = id);

-- Client admins can view users from their client
CREATE POLICY "Client admins can view client users" ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN system_roles sr ON ura.role_id = sr.id
            WHERE ura.user_id = auth.uid() 
            AND ura.is_active = true
            AND sr.role_type = 'client_admin'
            AND sr.client_id = users.client_id
        )
    );

-- Super admins can view all users
CREATE POLICY "Super admins can view all users" ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN system_roles sr ON ura.role_id = sr.id
            WHERE ura.user_id = auth.uid() 
            AND ura.is_active = true
            AND sr.role_type = 'super_admin'
        )
    );

-- Super admins can update all users
CREATE POLICY "Super admins can update all users" ON users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN system_roles sr ON ura.role_id = sr.id
            WHERE ura.user_id = auth.uid() 
            AND ura.is_active = true
            AND sr.role_type = 'super_admin'
        )
    );

-- Client admins can update users from their client
CREATE POLICY "Client admins can update client users" ON users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN system_roles sr ON ura.role_id = sr.id
            WHERE ura.user_id = auth.uid() 
            AND ura.is_active = true
            AND sr.role_type = 'client_admin'
            AND sr.client_id = users.client_id
        )
    );

-- RLS Policies for user_role_assignments table
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Users can view their own role assignments
CREATE POLICY "Users can view own role assignments" ON user_role_assignments FOR SELECT
    USING (auth.uid() = user_id);

-- Client admins can manage role assignments for their client
CREATE POLICY "Client admins can manage client role assignments" ON user_role_assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura_admin
            JOIN system_roles sr_admin ON ura_admin.role_id = sr_admin.id
            JOIN users target_user ON user_role_assignments.user_id = target_user.id
            WHERE ura_admin.user_id = auth.uid() 
            AND ura_admin.is_active = true
            AND sr_admin.role_type = 'client_admin'
            AND sr_admin.client_id = target_user.client_id
        )
    );

-- Super admins can manage all role assignments
CREATE POLICY "Super admins can manage all role assignments" ON user_role_assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN system_roles sr ON ura.role_id = sr.id
            WHERE ura.user_id = auth.uid() 
            AND ura.is_active = true
            AND sr.role_type = 'super_admin'
        )
    );

-- Add comments to document the migration
COMMENT ON TABLE users IS 'User accounts with system role integration';
COMMENT ON COLUMN users.system_role_id IS 'Primary system role ID from system_roles table';
COMMENT ON COLUMN users.role_type IS 'Cached role type for performance';
COMMENT ON COLUMN users.is_role_active IS 'Whether the user role is currently active';
COMMENT ON COLUMN users.role_assigned_at IS 'When the current role was assigned';
COMMENT ON COLUMN users.role_assigned_by IS 'User who assigned the current role';

COMMENT ON TABLE user_role_assignments IS 'Assignment of system roles to users';
COMMENT ON COLUMN user_role_assignments.is_primary IS 'Indicates if this is the user primary role';
COMMENT ON COLUMN user_role_assignments.expires_at IS 'Optional expiration date for role assignment';

-- Verification query to test the integration
-- This query demonstrates how to retrieve user role information with system roles
/*
SELECT 
    u.id as user_id,
    u.email,
    u.role_type as cached_role_type,
    sr.name as system_role_name,
    sr.role_type as system_role_type,
    sr.description as role_description,
    c.name as client_name,
    ura.is_primary,
    ura.is_active,
    ura.created_at as role_assigned_at,
    assignor.email as assigned_by_email
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.is_active = true
LEFT JOIN system_roles sr ON ura.role_id = sr.id
LEFT JOIN clients c ON sr.client_id = c.id
LEFT JOIN users assignor ON ura.assigned_by = assignor.id
WHERE u.email = 'test@example.com'
ORDER BY ura.is_primary DESC, ura.created_at DESC;
*/

-- Create function to get user's accessible pages
CREATE OR REPLACE FUNCTION get_user_accessible_pages(p_user_id UUID)
RETURNS TABLE (
    page_key VARCHAR,
    page_name VARCHAR,
    page_group VARCHAR,
    access_level access_level,
    can_create BOOLEAN,
    can_read BOOLEAN,
    can_update BOOLEAN,
    can_delete BOOLEAN,
    route_path VARCHAR,
    icon_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.page_key,
        p.page_name,
        p.page_group,
        rpa.access_level,
        rpa.can_create,
        rpa.can_read,
        rpa.can_update,
        rpa.can_delete,
        p.route_path,
        p.icon_name
    FROM users u
    JOIN user_role_assignments ura ON ura.user_id = u.id AND ura.is_active = true
    JOIN system_roles sr ON sr.id = ura.role_id AND sr.is_active = true
    JOIN role_page_access rpa ON rpa.role_id = sr.id AND rpa.access_level != 'none'
    JOIN pages p ON p.id = rpa.page_id AND p.is_active = true
    WHERE u.id = p_user_id 
    AND u.is_active = true
    ORDER BY p.page_group, p.sort_order, p.page_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new role for a client
CREATE OR REPLACE FUNCTION create_client_role(
    p_client_id UUID,
    p_role_name VARCHAR(50),
    p_role_type system_role_type,
    p_description TEXT,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_role_id UUID;
BEGIN
    -- Check if user has permission to create roles for this client
    IF NOT EXISTS (
        SELECT 1 FROM user_role_assignments ura
        JOIN system_roles sr ON ura.role_id = sr.id
        WHERE ura.user_id = p_created_by 
        AND ura.is_active = true
        AND (
            sr.role_type = 'super_admin' OR 
            (sr.role_type = 'client_admin' AND sr.client_id = p_client_id)
        )
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to create roles for this client';
    END IF;
    
    INSERT INTO system_roles (client_id, name, role_type, description, created_by, is_system_role)
    VALUES (p_client_id, p_role_name, p_role_type, p_description, p_created_by, false)
    RETURNING id INTO v_role_id;
    
    -- Log the role creation
    PERFORM log_role_access(p_created_by, v_role_id, 'role_created', jsonb_build_object('client_id', p_client_id));
    
    RETURN v_role_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign page permissions to a client role
CREATE OR REPLACE FUNCTION assign_role_page_permissions(
    p_role_id UUID,
    p_page_permissions JSONB, -- Array of {page_id, access_level, permissions}
    p_assigned_by UUID
) RETURNS VOID AS $$
DECLARE
    v_permission JSONB;
    v_client_id UUID;
BEGIN
    -- Get the client ID for this role
    SELECT client_id INTO v_client_id FROM system_roles WHERE id = p_role_id;
    
    -- Check if user has permission to assign permissions
    IF NOT EXISTS (
        SELECT 1 FROM user_role_assignments ura
        JOIN system_roles sr ON ura.role_id = sr.id
        WHERE ura.user_id = p_assigned_by 
        AND ura.is_active = true
        AND (
            sr.role_type = 'super_admin' OR 
            (sr.role_type = 'client_admin' AND ura.client_id = v_client_id)
        )
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to assign page permissions';
    END IF;
    
    -- Delete existing permissions for this role
    DELETE FROM role_page_access WHERE role_id = p_role_id;
    
    -- Insert new permissions
    FOR v_permission IN SELECT * FROM jsonb_array_elements(p_page_permissions)
    LOOP
        INSERT INTO role_page_access (
            role_id, 
            page_id, 
            access_level, 
            can_create, 
            can_read, 
            can_update, 
            can_delete, 
            can_export, 
            can_import
        ) VALUES (
            p_role_id,
            (v_permission->>'page_id')::UUID,
            (v_permission->>'access_level')::access_level,
            COALESCE((v_permission->>'can_create')::BOOLEAN, false),
            COALESCE((v_permission->>'can_read')::BOOLEAN, true),
            COALESCE((v_permission->>'can_update')::BOOLEAN, false),
            COALESCE((v_permission->>'can_delete')::BOOLEAN, false),
            COALESCE((v_permission->>'can_export')::BOOLEAN, false),
            COALESCE((v_permission->>'can_import')::BOOLEAN, false)
        );
    END LOOP;
    
    -- Log the permission assignment
    PERFORM log_role_access(p_assigned_by, p_role_id, 'permissions_updated', 
        jsonb_build_object('page_count', jsonb_array_length(p_page_permissions)));
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log role access
CREATE OR REPLACE FUNCTION log_role_access(
    p_user_id UUID,
    p_role_id UUID,
    p_action VARCHAR(50),
    p_details JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
BEGIN
    INSERT INTO role_audit_log (role_id, user_id, action, details)
    VALUES (p_role_id, p_user_id, p_action, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get client roles with their permissions
CREATE OR REPLACE FUNCTION get_client_roles_with_permissions(p_client_id UUID, p_user_id UUID)
RETURNS TABLE (
    role_id UUID,
    role_name VARCHAR,
    role_type system_role_type,
    description TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    page_permissions JSONB
) AS $$
BEGIN
    -- Check if user has permission to view client roles
    IF NOT EXISTS (
        SELECT 1 FROM user_role_assignments ura
        JOIN system_roles sr ON ura.role_id = sr.id
        WHERE ura.user_id = p_user_id 
        AND ura.is_active = true
        AND (
            sr.role_type = 'super_admin' OR 
            (sr.role_type = 'client_admin' AND ura.client_id = p_client_id)
        )
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to view client roles';
    END IF;
    
    RETURN QUERY
    SELECT 
        sr.id,
        sr.name,
        sr.role_type,
        sr.description,
        sr.is_active,
        sr.created_at,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'page_id', p.id,
                    'page_name', p.name,
                    'page_key', p.page_key,
                    'page_group', p.page_group,
                    'access_level', rpa.access_level,
                    'can_create', rpa.can_create,
                    'can_read', rpa.can_read,
                    'can_update', rpa.can_update,
                    'can_delete', rpa.can_delete,
                    'can_export', rpa.can_export,
                    'can_import', rpa.can_import
                )
                ORDER BY p.page_group, p.name
            ) FILTER (WHERE p.id IS NOT NULL),
            '[]'::jsonb
        ) as page_permissions
    FROM system_roles sr
    LEFT JOIN role_page_access rpa ON sr.id = rpa.role_id
    LEFT JOIN pages p ON rpa.page_id = p.id
    WHERE sr.client_id = p_client_id
    GROUP BY sr.id, sr.name, sr.role_type, sr.description, sr.is_active, sr.created_at
    ORDER BY sr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update client role
CREATE OR REPLACE FUNCTION update_client_role(
    p_role_id UUID,
    p_role_name VARCHAR(50),
    p_description TEXT,
    p_is_active BOOLEAN,
    p_updated_by UUID
) RETURNS VOID AS $$
DECLARE
    v_client_id UUID;
BEGIN
    -- Get the client ID for this role
    SELECT client_id INTO v_client_id FROM system_roles WHERE id = p_role_id;
    
    -- Check if user has permission to update this role
    IF NOT EXISTS (
        SELECT 1 FROM user_role_assignments ura
        JOIN system_roles sr ON ura.role_id = sr.id
        WHERE ura.user_id = p_updated_by 
        AND ura.is_active = true
        AND (
            sr.role_type = 'super_admin' OR 
            (sr.role_type = 'client_admin' AND ura.client_id = v_client_id)
        )
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to update this role';
    END IF;
    
    UPDATE system_roles 
    SET 
        name = p_role_name,
        description = p_description,
        is_active = p_is_active,
        updated_at = NOW()
    WHERE id = p_role_id;
    
    -- Log the role update
    PERFORM log_role_access(p_updated_by, p_role_id, 'role_updated', 
        jsonb_build_object('name', p_role_name, 'is_active', p_is_active));
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;