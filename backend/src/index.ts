import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import clientRoutes from './routes/clients';
import storeRoutes from './routes/stores';
import transactionRoutes from './routes/transactions';
import rolesRoutes from './routes/roles';
import salesRoutes from './routes/sales';
import purchaseRoutes from './routes/purchases';
import expenseRoutes from './routes/expenses';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Supabase
export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/expenses', expenseRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;