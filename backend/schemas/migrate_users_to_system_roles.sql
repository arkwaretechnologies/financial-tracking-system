-- Migration: Add system role columns to users table
-- This ensures the users table has the new system role columns

-- Add system role columns to users table if they don't exist
DO $$ 
BEGIN
    -- Add system_role_id column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'system_role_id'
    ) THEN
        ALTER TABLE users ADD COLUMN system_role_id UUID REFERENCES system_roles(id) ON DELETE SET NULL;
        RAISE NOTICE 'Column system_role_id added to users table';
    ELSE
        RAISE NOTICE 'Column system_role_id already exists in users table';
    END IF;

    -- Add role_type column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role_type'
    ) THEN
        ALTER TABLE users ADD COLUMN role_type system_role_type;
        RAISE NOTICE 'Column role_type added to users table';
    ELSE
        RAISE NOTICE 'Column role_type already exists in users table';
    END IF;

    -- Add is_role_active column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'is_role_active'
    ) THEN
        ALTER TABLE users ADD COLUMN is_role_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Column is_role_active added to users table';
    ELSE
        RAISE NOTICE 'Column is_role_active already exists in users table';
    END IF;

    -- Add role_assigned_at column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role_assigned_at'
    ) THEN
        ALTER TABLE users ADD COLUMN role_assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Column role_assigned_at added to users table';
    ELSE
        RAISE NOTICE 'Column role_assigned_at already exists in users table';
    END IF;

    -- Add role_assigned_by column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role_assigned_by'
    ) THEN
        ALTER TABLE users ADD COLUMN role_assigned_by UUID REFERENCES users(id);
        RAISE NOTICE 'Column role_assigned_by added to users table';
    ELSE
        RAISE NOTICE 'Column role_assigned_by already exists in users table';
    END IF;
END $$;

-- Add comments to document the new columns
COMMENT ON COLUMN users.system_role_id IS 'Primary system role ID from system_roles table';
COMMENT ON COLUMN users.role_type IS 'Cached role type for performance';
COMMENT ON COLUMN users.is_role_active IS 'Whether the user role is currently active';
COMMENT ON COLUMN users.role_assigned_at IS 'When the current role was assigned';
COMMENT ON COLUMN users.role_assigned_by IS 'User who assigned the current role';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_system_role_id ON users(system_role_id);
CREATE INDEX IF NOT EXISTS idx_users_role_type ON users(role_type);
CREATE INDEX IF NOT EXISTS idx_users_role_assigned_by ON users(role_assigned_by);

-- Update existing users to have default system role assignments
-- This assigns a default role to existing users based on their current role
DO $$
DECLARE
    user_record RECORD;
    default_role_id UUID;
    default_role_type system_role_type;
BEGIN
    -- Get the default client_user role
    SELECT id, role_type INTO default_role_id, default_role_type
    FROM system_roles 
    WHERE role_type = 'viewer' 
    AND is_active = true 
    LIMIT 1;

    IF default_role_id IS NULL THEN
        RAISE NOTICE 'No default system role found, skipping user role assignment';
        RETURN;
    END IF;

    -- Update users that don't have a system role assigned
    FOR user_record IN 
        SELECT id, role 
        FROM users 
        WHERE system_role_id IS NULL
    LOOP
        -- Map old roles to new system roles
        CASE user_record.role
            WHEN 'super_admin' THEN
                SELECT id, role_type INTO default_role_id, default_role_type
                FROM system_roles 
                WHERE role_type = 'super_admin' 
                AND is_active = true 
                LIMIT 1;
            WHEN 'admin' THEN
                SELECT id, role_type INTO default_role_id, default_role_type
                FROM system_roles 
                WHERE role_type = 'client_admin' 
                AND is_active = true 
                LIMIT 1;
            WHEN 'client_user' THEN
                SELECT id, role_type INTO default_role_id, default_role_type
                FROM system_roles 
                WHERE role_type = 'viewer' 
                AND is_active = true 
                LIMIT 1;
            ELSE
                -- Default to viewer role
                SELECT id, role_type INTO default_role_id, default_role_type
                FROM system_roles 
                WHERE role_type = 'viewer' 
                AND is_active = true 
                LIMIT 1;
        END CASE;

        -- Update the user with the system role
        UPDATE users 
        SET 
            system_role_id = default_role_id,
            role_type = default_role_type,
            role_assigned_at = NOW(),
            is_role_active = true
        WHERE id = user_record.id;

        RAISE NOTICE 'Updated user % with system role %', user_record.id, default_role_type;
    END LOOP;

    RAISE NOTICE 'Migration completed successfully';
END $$;