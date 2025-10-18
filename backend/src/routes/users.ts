import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { getAllUsers, getUsersByClient, createUser, updateUser, deleteUser } from '../controllers/userController';

const router = express.Router();

// Get all users (Super Admin and Admin)
router.get('/', authenticateToken as any, requireRole(['super_admin', 'admin']), getAllUsers);

// Get users by client (Admin and Super Admin)
router.get('/client/:clientId', authenticateToken as any, requireRole(['super_admin', 'admin']), getUsersByClient);

// Create user (Admin and Super Admin)
router.post('/', authenticateToken as any, requireRole(['super_admin', 'admin']), createUser);

// Update user (Admin and Super Admin)
router.put('/:userId', authenticateToken as any, requireRole(['super_admin', 'admin']), updateUser);

// Delete user (Admin and Super Admin)
router.delete('/:userId', authenticateToken as any, requireRole(['super_admin', 'admin']), deleteUser);

export default router;
