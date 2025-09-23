import express from 'express';
import { login, register, me, validateClient } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/validate-client', validateClient);
router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticateToken as any, me);

export default router;