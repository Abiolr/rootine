import { Router } from 'express';
import { register, login, logout } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Ensure this says .post, not .get
router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);

router.get('/me', authenticateToken, (req, res) => {
  res.status(200).json({ 
    message: 'You have access to this protected data', 
    user: req.user 
  });
});

export default router;