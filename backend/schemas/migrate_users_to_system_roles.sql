-- Migration script to update users table to work with system_roles table
-- This script updates the users table schema to integrate with the comprehensive role-based access control system

-- Step 1: Add system role integration columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS system_role_id UUID REFERENCES system_roles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS role_type system_role_type, -- New role type from system_role_type enum
ADD COLUMN IF NOT EXISTS is_role_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS role_assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS role_assigned_by UUID REFERENCES users(id);

-- Step 2: Create user_role_assignments table if it doesn't exist (from role_page_access_schema)
CREATE TABLE IF NOT EXISTS user_role_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, role_id, client_id)
);

-- Step 3: Migrate existing user roles to system roles
-- First, ensure system roles exist for the basic roles
INSERT INTO system_roles (id, name, role_type, client_id, description, is_system_role, is_active, created_by)
VALUES 
    ('00000000-0000-0000-0000-000000000010', 'Super Administrator', 'super_admin', NULL, 'System-wide super administrator with full access', true, true, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000020', 'Client Administrator', 'client_admin', NULL, 'Client administrator with management access', true, true, '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000030', 'Client User', 'viewer', NULL, 'Basic client user with read-only access', true, true, '00000-0000-0000-0000-0000000000001')
ON CONFLICT (id) DO NOTHING;

-- Step 4: Update existing users to use system roles
-- Migrate super_admin users
UPDATE users 
SET system_role_id = '00000000-0000-0000-0000-000000000010',
    role_type = 'super_admin'
WHERE role = 'super_admin';

-- Migrate admin users to client_admin
UPDATE users 
SET system_role_id = '00000000-0000-0000-0000-000000000020',
    role_type = 'client_admin'
WHERE role = 'admin';

-- Migrate client_user to viewer
UPDATE users 
SET system_role_id = '00000000-0000-0000-0000-000000000030',
    role_type = 'viewer'
WHERE role = 'client_user';

-- Step 5: Create user_role_assignments for existing users
INSERT INTO user_role_assignments (user_id, role_id, client_id, assigned_by, is_active, assigned_at)
SELECT 
    u.id,
    u.system_role_id,
    u.client_id,
    '00000000-0000-0000-0000-000000000001', -- System admin
    true,
    NOW()
FROM users u
WHERE u.system_role_id IS NOT NULL
ON CONFLICT (user_id, role_id, client_id) DO NOTHING;

-- Step 6: Update role_assigned_by for system created users
UPDATE users 
SET role_assigned_by = '00000000-0000-0000-0000-000000000001'
WHERE role_assigned_by IS NULL AND system_role_id IS NOT NULL;

-- Step 7: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_system_role_id ON users(system_role_id);
CREATE INDEX IF NOT EXISTS idx_users_role_type ON users(role_type);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role_id ON user_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_client_id ON user_role_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_is_active ON user_role_assignments(is_active);

-- Step 8: Create function to get user role details
CREATE OR REPLACE FUNCTION get_user_role_details(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    system_role_id UUID,
    role_name VARCHAR,
    role_type system_role_type,
    client_id UUID,
    role_description TEXT,
    is_role_active BOOLEAN,
    role_assigned_at TIMESTAMP WITH TIME ZONE,
    role_assigned_by UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.system_role_id,
        sr.name,
        u.role_type,
        u.client_id,
        sr.description,
        u.is_role_active,
        u.role_assigned_at,
        u.role_assigned_by
    FROM users u
    LEFT JOIN system_roles sr ON u.system_role_id = sr.id
    WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create function to assign system role to user
CREATE OR REPLACE FUNCTION assign_system_role_to_user(
    p_user_id UUID,
    p_role_id UUID,
    p_assigned_by UUID,
    p_client_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_role_client_id UUID;
BEGIN
    -- Get the client_id from the role
    SELECT client_id INTO v_role_client_id FROM system_roles WHERE id = p_role_id;
    
    -- Check if role is client-specific and user belongs to that client
    IF v_role_client_id IS NOT NULL AND v_role_client_id != p_client_id THEN
        RAISE EXCEPTION 'Role is client-specific and user does not belong to that client';
    END IF;
    
    -- Update user's system role
    UPDATE users 
    SET system_role_id = p_role_id,
        role_type = (SELECT role_type FROM system_roles WHERE id = p_role_id),
        role_assigned_by = p_assigned_by,
        role_assigned_at = NOW(),
        is_role_active = true
    WHERE id = p_user_id;
    
    -- Create user role assignment record
    INSERT INTO user_role_assignments (user_id, role_id, client_id, assigned_by, is_active, assigned_at)
    VALUES (p_user_id, p_role_id, COALESCE(v_role_client_id, p_client_id), p_assigned_by, true, NOW())
    ON CONFLICT (user_id, role_id, client_id) DO UPDATE
    SET is_active = true, assigned_at = NOW();
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Add RLS policies for the updated users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- Admins can view users for their client
CREATE POLICY "Admins can view client users" ON users
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN system_roles sr ON ura.role_id = sr.id
            WHERE ura.user_id = auth.uid() 
            AND ura.is_active = true
            AND sr.role_type IN ('super_admin', 'client_admin')
            AND (
                sr.role_type = 'super_admin' OR
                users.client_id = (SELECT client_id FROM users WHERE id = auth.uid())
            )
        )
    );

-- Super admins can manage all users
CREATE POLICY "Super admins can manage all users" ON users
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN system_roles sr ON ura.role_id = sr.id
            WHERE ura.user_id = auth.uid() 
            AND ura.is_active = true
            AND sr.role_type = 'super_admin'
        )
    );

-- Step 11: Add comment to document the migration
COMMENT ON TABLE users IS 'Users table with system role integration - supports comprehensive role-based access control';
COMMENT ON COLUMN users.system_role_id IS 'Reference to system_roles table for role-based permissions';
COMMENT ON COLUMN users.role_type IS 'Cached role type from system_roles for performance';
COMMENT ON COLUMN users.is_role_active IS 'Whether the user role assignment is currently active';
COMMENT ON COLUMN users.role_assigned_at IS 'Timestamp when the system role was assigned';
COMMENT ON COLUMN users.role_assigned_by IS 'User who assigned the system role';

-- Step 12: Verify migration success
-- This query shows the migration status
SELECT 
    u.id,
    u.email,
    u.role as old_role,
    sr.name as system_role_name,
    sr.role_type as system_role_type,
    u.client_id,
    u.is_role_active
FROM users u
LEFT JOIN system_roles sr ON u.system_role_id = sr.id
ORDER BY u.created_at;