# Database Schemas Documentation

This folder contains all database schema files for the Financial Tracking System (FTS).

## 📁 Schema Files

### 1. `supabase_schema.sql`
**Description**: Original database schema with basic tables for the financial tracking system.
**Tables**: 
- clients, stores, users, transactions
- Enums for user roles and transaction types
- Row-level security (RLS) policies
- Sample data inserts

### 2. `role_based_schema.sql`
**Description**: Enhanced role-based access control schema with role-specific passwords and component-level permissions.
**Key Features**:
- Role-based authentication with individual passwords per role
- Component-level access control (11 components, 4 access levels)
- Page/route protection
- Session management and audit logging
- Row-level security policies

### 3. `role_based_sample_data.sql`
**Description**: Sample data demonstrating the role-based access control system.
**Includes**:
- Sample client and stores
- 5 different roles with varying permissions
- Sample users assigned to different roles
- Component permissions for each role
- Sample transactions with role tracking

### 4. `role_based_implementation_guide.md`
**Description**: Comprehensive implementation guide for the role-based access control system.
**Contents**:
- Authentication flow examples
- Backend API implementation
- Frontend integration examples
- Security considerations
- Testing procedures

## 🚀 Usage Instructions

### Setup Database
```bash
# Run the original schema (if starting fresh)
psql -d your_database -f supabase_schema.sql

# Run the enhanced role-based schema
psql -d your_database -f role_based_schema.sql

# Load sample data (optional)
psql -d your_database -f role_based_sample_data.sql
```

### Role-Based Authentication Flow
1. User logs in with email and role-specific password
2. System validates credentials against the selected role
3. Session is created with role-specific permissions
4. Component access is checked based on role permissions
5. Page access is controlled by role-based routing

## 🔐 Security Features

- **Password Hashing**: All role passwords are hashed using bcrypt
- **Session Management**: Secure session tokens with expiration
- **Audit Logging**: All access attempts are logged
- **Row-Level Security**: Database-level security policies
- **Component Access Control**: Granular permissions per component
- **Page Protection**: Route-level access control

## 📋 Role Types

| Role | Description | Access Level |
|------|-------------|--------------|
| `super_admin` | System-wide administrator | Full access |
| `client_admin` | Organization administrator | Full client access |
| `store_manager` | Store operations manager | Store management |
| `accountant` | Financial operations | Financial data |
| `cashier` | Sales transactions | Basic sales |
| `viewer` | Read-only access | Reports only |

## 🛠️ Components

- `dashboard` - System dashboard
- `transactions` - Transaction management
- `sales` - Sales operations
- `purchases` - Purchase management
- `expenses` - Expense tracking
- `reports` - Reporting system
- `clients` - Client management
- `stores` - Store management
- `users` - User management
- `settings` - System settings
- `admin_panel` - Administrative functions

## 📖 Documentation

For detailed implementation instructions, see `role_based_implementation_guide.md` which includes:
- Complete authentication flow
- Backend API examples
- Frontend integration
- Security best practices
- Testing procedures

## 🔧 Database Functions

### Authentication Functions
- `authenticate_role(email, password, role_name)` - Authenticate user with specific role
- `check_component_access(user_id, component, required_level)` - Check component access
- `log_role_access(user_id, role_id, action, component, page_path)` - Log access attempts

## 📊 Sample Data

The `role_based_sample_data.sql` file creates a complete example with:
- ABC Corporation client with 2 stores
- 5 users with different roles
- Role-specific permissions for each component
- Sample transactions with role tracking
- Audit log entries

## 📝 Notes

- All passwords in sample data use bcrypt hashing (passwords: admin123, manager123, etc.)
- Sessions expire after 24 hours by default
- Failed access attempts are logged for security monitoring
- Role permissions can be customized per client organization