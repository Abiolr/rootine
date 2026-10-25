import { Router } from 'express';
import { logSet, updateSet, deleteSet } from '../controllers/set.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', authenticateToken, logSet);
router.patch('/:id', authenticateToken, updateSet);
router.delete('/:id', authenticateToken, deleteSet);

export default router;