import { Router } from 'express';
import { startWorkout, completeWorkout } from '../controllers/workout.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/start', authenticateToken, startWorkout);
router.patch('/:id/complete', authenticateToken, completeWorkout);

export default router;