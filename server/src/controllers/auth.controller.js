import { prisma } from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { calculateTreeStatus } from '../utils/progression.util.js';

export const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: { username, password_hash }
    });

    const { password_hash: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ message: 'User registered successfully', user: userWithoutPassword });
  } catch (error) {
    console.error('[Auth Controller] Register Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.userId, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return the saved progress so the client shows the same XP/status after relogin
    res.status(200).json({
      token,
      userId: user.userId,
      username: user.username,
      xp: user.xp,
      penalty_points: user.penalty_points,
      status: calculateTreeStatus(user.xp, user.penalty_points),
    });
  } catch (error) {
    console.error('[Auth Controller] Login Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = (req, res) => {
  // Since JWTs are stateless, actual invalidation happens by deleting the token on the client.
  // This endpoint serves as a successful acknowledgement for the frontend to clear its state.
  res.status(200).json({ message: 'Logged out successfully. Please remove the token on the client.' });
};
