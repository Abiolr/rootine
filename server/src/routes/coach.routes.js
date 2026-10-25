import { Router } from 'express';
import { chat } from '../controllers/coach.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/chat', authenticateToken, chat);

export default router;
