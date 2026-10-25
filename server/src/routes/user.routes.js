import { Router } from 'express';
import { getMe, addXp, addPenalty } from '../controllers/user.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/me', authenticateToken, getMe);
router.patch('/xp', authenticateToken, addXp);
router.patch('/penalty', authenticateToken, addPenalty);

export default router;
