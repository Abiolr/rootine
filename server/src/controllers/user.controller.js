import { prisma } from '../config/db.js';
import { calculateTreeStatus } from '../utils/progression.util.js';

export const addXp = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'A valid positive amount is required' });
    }

    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newXp = user.xp + amount;
    const newStatus = calculateTreeStatus(newXp, user.penalty_points);

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: { xp: newXp, status: newStatus },
      select: { userId: true, username: true, xp: true, penalty_points: true, status: true }
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('[User Controller] Add XP Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addPenalty = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'A valid positive amount is required' });
    }

    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newPenaltyPoints = user.penalty_points + amount;
    const newStatus = calculateTreeStatus(user.xp, newPenaltyPoints);

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: { penalty_points: newPenaltyPoints, status: newStatus },
      select: { userId: true, username: true, xp: true, penalty_points: true, status: true }
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('[User Controller] Add Penalty Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};