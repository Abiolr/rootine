import { prisma } from '../config/db.js';

export const startWorkout = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Prevent starting a new workout if one is already in progress
    const activeWorkout = await prisma.workout.findFirst({
      where: { userId, status: 'IN_PROGRESS' }
    });

    if (activeWorkout) {
      return res.status(409).json({ error: 'You already have an active workout in progress' });
    }

    const newWorkout = await prisma.workout.create({
      data: { userId, status: 'IN_PROGRESS' }
    });

    res.status(201).json(newWorkout);
  } catch (error) {
    console.error('[Workout Controller] Start Workout Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const completeWorkout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: workoutId } = req.params;

    if (!workoutId) {
      return res.status(400).json({ error: 'Workout ID is required' });
    }

    const workout = await prisma.workout.findUnique({ where: { workoutId } });
    
    // Explicit authorization check
    if (!workout || workout.userId !== userId) {
      return res.status(404).json({ error: 'Workout not found or unauthorized' });
    }

    if (workout.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Workout is already completed' });
    }

    const updatedWorkout = await prisma.workout.update({
      where: { workoutId },
      data: { 
        status: 'COMPLETED',
        endTime: new Date()
      }
    });

    res.status(200).json(updatedWorkout);
  } catch (error) {
    console.error('[Workout Controller] Complete Workout Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};