# Role-Based Access Control Implementation Guide

## Overview
This document describes the role-based access control (RBAC) system for the Financial Tracking System. Each client has multiple roles, each requiring a password to access specific components and pages.

## Database Schema

### Key Tables

1. **client_roles** - Stores role definitions with passwords
2. **user_roles** - Links users to roles
3. **component_permissions** - Defines component-level access
4. **page_access** - Controls page/route access
5. **role_sessions** - Tracks active role sessions
6. **role_audit_log** - Logs role access activities

### Role Types
- `super_admin` - System-wide administrator
- `client_admin` - Full access to their organization
- `store_manager` - Store operations management
- `accountant` - Financial operations and reporting
- `cashier` - Basic sales and transactions
- `viewer` - Read-only access to reports

## Implementation Steps

### 1. Setup Database
```sql
-- Run the main schema
psql -d your_database -f role_based_schema.sql

-- Run sample data (optional)
psql -d your_database -f role_based_sample_data.sql
```

### 2. Authentication Flow

#### User Login Process
```javascript
// Frontend: User selects role and enters password
const loginWithRole = async (email, password, roleName) => {
  const response = await fetch('/api/auth/login-role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, roleName })
  });
  return response.json();
};
```

#### Backend Authentication
```javascript
// API Endpoint: /api/auth/login-role
app.post('/api/auth/login-role', async (req, res) => {
  const { email, password, roleName } = req.body;
  
  try {
    // Call the authenticate_role function
    const result = await supabase.rpc('authenticate_role', {
      p_email: email,
      p_password: password,
      p_role_name: roleName
    });
    
    if (result.data[0].success) {
      // Create session token
      const sessionToken = generateSessionToken();
      
      // Store session in role_sessions table
      await supabase.from('role_sessions').insert({
        user_id: result.data[0].user_id,
        role_id: result.data[0].role_id,
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
      
      // Log successful login
      await supabase.rpc('log_role_access', {
        p_user_id: result.data[0].user_id,
        p_role_id: result.data[0].role_id,
        p_action: 'login'
      });
      
      res.json({
        success: true,
        sessionToken,
        user: {
          id: result.data[0].user_id,
          roleId: result.data[0].role_id,
          clientId: result.data[0].client_id
        }
      });
    } else {
      res.json({ success: false, message: result.data[0].message });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
});
```

### 3. Component Access Control

#### Check Component Access
```javascript
// Frontend: Check if user can access a component
const canAccessComponent = async (component, requiredLevel = 'read') => {
  const response = await fetch('/api/auth/check-component', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`
    },
    body: JSON.stringify({ component, requiredLevel })
  });
  return response.json();
};
```

#### Backend Component Check
```javascript
// API Endpoint: /api/auth/check-component
app.post('/api/auth/check-component', authenticateSession, async (req, res) => {
  const { component, requiredLevel } = req.body;
  const { userId } = req.user;
  
  try {
    const result = await supabase.rpc('check_component_access', {
      p_user_id: userId,
      p_component: component,
      p_required_level: requiredLevel
    });
    
    // Log access attempt
    await supabase.rpc('log_role_access', {
      p_user_id: userId,
      p_role_id: req.user.roleId,
      p_action: 'component_access',
      p_component: component,
      p_success: result.data[0].check_component_access
    });
    
    res.json({ 
      canAccess: result.data[0].check_component_access 
    });
  } catch (error) {
    res.status(500).json({ canAccess: false });
  }
});
```

### 4. Page/Route Protection

#### Middleware for Route Protection
```javascript
// Middleware to check page access
const requirePageAccess = (pagePath) => {
  return async (req, res, next) => {
    const { userId, roleId } = req.user;
    
    try {
      const { data: pageAccess } = await supabase
        .from('page_access')
        .select('can_access')
        .eq('role_id', roleId)
        .eq('page_path', pagePath)
        .single();
      
      if (pageAccess && pageAccess.can_access) {
        next();
      } else {
        await supabase.rpc('log_role_access', {
          p_user_id: userId,
          p_role_id: roleId,
          p_action: 'access_denied',
          p_page_path: pagePath,
          p_success: false
        });
        
        res.status(403).json({ 
          error: 'Access denied to this page' 
        });
      }
    } catch (error) {
      res.status(500).json({ error: 'Access check failed' });
    }
  };
};

// Use the middleware
app.get('/admin/users', authenticateSession, requirePageAccess('/admin/users'), (req, res) => {
  // Handle the admin users page
});
```

### 5. Session Management

#### Session Authentication Middleware
```javascript
const authenticateSession = async (req, res, next) => {
  const sessionToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionToken) {
    return res.status(401).json({ error: 'No session token provided' });
  }
  
  try {
    const { data: session } = await supabase
      .from('role_sessions')
      .select('user_id, role_id, expires_at')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();
    
    if (!session || new Date(session.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    // Update last activity
    await supabase
      .from('role_sessions')
      .update({ last_activity: new Date() })
      .eq('session_token', sessionToken);
    
    req.user = {
      userId: session.user_id,
      roleId: session.role_id
    };
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Session validation failed' });
  }
};
```

### 6. Frontend Integration

#### Role Selection Component
```javascript
// React component for role selection
import { useState, useEffect } from 'react';

const RoleSelector = ({ user, onRoleSelected }) => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [password, setPassword] = useState('');
  
  useEffect(() => {
    // Fetch available roles for the user
    fetchUserRoles(user.id).then(setRoles);
  }, [user.id]);
  
  const handleRoleLogin = async () => {
    const result = await loginWithRole(user.email, password, selectedRole);
    if (result.success) {
      onRoleSelected(result.user);
    } else {
      alert(result.message);
    }
  };
  
  return (
    <div className="role-selector">
      <h3>Select Role to Continue</h3>
      <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
        <option value="">Choose a role...</option>
        {roles.map(role => (
          <option key={role.id} value={role.role_name}>
            {role.role_name} - {role.description}
          </option>
        ))}
      </select>
      <input
        type="password"
        placeholder="Role password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleRoleLogin}>Login with Role</button>
    </div>
  );
};
```

#### Protected Component
```javascript
// React component with role-based access
import { useState, useEffect } from 'react';

const ProtectedComponent = ({ componentName, requiredLevel = 'read', children }) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    checkComponentAccess(componentName, requiredLevel).then(result => {
      setHasAccess(result.canAccess);
      setLoading(false);
    });
  }, [componentName, requiredLevel]);
  
  if (loading) return <div>Checking access...</div>;
  
  if (!hasAccess) {
    return <div>Access denied to {componentName}</div>;
  }
  
  return children;
};

// Usage
<ProtectedComponent componentName="transactions" requiredLevel="write">
  <TransactionForm />
</ProtectedComponent>
```

## Security Considerations

### 1. Password Security
- Always hash passwords using bcrypt or similar
- Implement password complexity requirements
- Regular password rotation policies
- Account lockout after failed attempts

### 2. Session Security
- Use secure, HTTP-only cookies for session tokens
- Implement session timeout
- Log all authentication attempts
- Monitor for suspicious activity

### 3. Audit Logging
- Log all role access attempts
- Track permission changes
- Monitor failed access attempts
- Regular security reviews

### 4. Data Protection
- Implement row-level security (RLS) policies
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Regular security audits

## Testing

### Test Authentication
```bash
# Test role authentication
curl -X POST http://localhost:3000/api/auth/login-role \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.smith@abc-corp.com",
    "password": "admin123",
    "roleName": "client_admin"
  }'
```

### Test Component Access
```bash
# Test component access (with session token)
curl -X POST http://localhost:3000/api/auth/check-component \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "component": "transactions",
    "requiredLevel": "write"
  }'
```

## Monitoring and Maintenance

### Regular Tasks
1. Review audit logs for suspicious activity
2. Update role permissions as needed
3. Rotate passwords regularly
4. Monitor failed login attempts
5. Clean up expired sessions

### Performance Optimization
1. Add database indexes for frequently queried fields
2. Implement caching for permission checks
3. Use connection pooling for database connections
4. Monitor query performance and optimize as needed

This role-based access control system provides granular security and flexibility for managing user access across different clients and their respective stores and components.