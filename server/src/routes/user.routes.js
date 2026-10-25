import { Router } from 'express';
import { addXp, addPenalty } from '../controllers/user.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.patch('/xp', authenticateToken, addXp);
router.patch('/penalty', authenticateToken, addPenalty);

export default router;