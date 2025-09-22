# Financial Tracking System (FTS)

A comprehensive web application for managing financial transactions across multiple stores and clients. Built with Next.js frontend and Node.js/Express backend, powered by Supabase for database and authentication.

## Features

### Core Functionality
- **Multi-Client Support**: Super Admin can manage multiple clients
- **Store Management**: Each client can have multiple stores
- **User Management**: Role-based access control (Super Admin, Admin, Client User)
- **Transaction Management**: Record and track Sales, Purchases, and Expenses
- **Real-time Dashboard**: View financial summaries and recent activities
- **Secure Authentication**: JWT-based authentication with role-based access

### User Roles
- **Super Admin**: Manage all clients and system settings
- **Admin**: Manage users and stores within their client organization
- **Client User**: Record and view transactions for assigned stores

## Tech Stack

### Frontend
- Next.js 15 with TypeScript
- Tailwind CSS for styling
- Shadcn/ui components
- React Context for state management

### Backend
- Node.js with Express
- TypeScript
- JWT authentication
- Supabase for database

### Database
- PostgreSQL via Supabase
- Row Level Security (RLS) policies
- Proper indexing and relationships

## Project Structure

```
FTS/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/    # Authentication & validation
│   │   ├── routes/        # API routes
│   │   ├── types/         # TypeScript interfaces
│   │   └── config/        # Database configuration
│   └── supabase_schema.sql # Database schema
├── frontend/               # Next.js application
│   ├── src/
│   │   ├── app/          # Next.js app directory
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React contexts
│   │   └── lib/          # Utilities and configuration
│   └── public/           # Static assets
```

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd FTS
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret_key
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup
1. Create a new Supabase project
2. Run the SQL schema from `backend/supabase_schema.sql`
3. Configure Row Level Security policies as defined in the schema

### 5. Start Development Servers

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (admin only)
- `GET /api/auth/me` - Get current user profile

### Users
- `GET /api/users` - Get all users (admin/super admin)
- `POST /api/users` - Create new user (admin/super admin)
- `GET /api/users/client/:clientId` - Get users by client (admin/super admin)

### Clients
- `GET /api/clients` - Get all clients (super admin)
- `POST /api/clients` - Create new client (super admin)
- `GET /api/clients/:id` - Get client by ID (super admin)

### Stores
- `GET /api/stores/client/:clientId` - Get stores by client
- `POST /api/stores` - Create new store (admin/super admin)
- `GET /api/stores/:id` - Get store by ID

### Transactions
- `GET /api/transactions/store/:storeId` - Get transactions by store
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/summary/:storeId` - Get transaction summary

## Default Credentials

Super Admin Account:
- Client ID: `00000000-0000-0000-0000-000000000001`
- Email: `superadmin@fts.com`
- Password: `admin123`

## Security Features

- JWT-based authentication
- Role-based access control
- Row Level Security in database
- Password hashing with bcrypt
- Environment variable protection
- Input validation and sanitization

## Deployment

### Backend Deployment
1. Set up production environment variables
2. Build the application: `npm run build`
3. Start the server: `npm start`

### Frontend Deployment
1. Set up production environment variables
2. Build the application: `npm run build`
3. Deploy to Vercel, Netlify, or your preferred platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.