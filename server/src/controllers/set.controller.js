import { prisma } from '../config/db.js';

export const logSet = async (req, res) => {
  try {
    const { workoutId, exercise, sets, reps, weightKg, date } = req.body;
    const userId = req.user.userId;

    if (!workoutId || !exercise || !sets || !reps) {
      return res.status(400).json({ error: 'Missing required set fields' });
    }

    const workout = await prisma.workout.findUnique({ where: { workoutId } });
    
    if (!workout || workout.userId !== userId) {
      return res.status(404).json({ error: 'Workout not found or unauthorized' });
    }
    
    if (workout.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot add sets to a completed workout' });
    }

    const newSet = await prisma.set.create({
      data: {
        workoutId,
        exercise,
        sets,
        reps,
        weightKg,
        date: date ? new Date(date) : new Date()
      }
    });

    res.status(201).json(newSet);
  } catch (error) {
    console.error('[Set Controller] Log Set Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSet = async (req, res) => {
  try {
    const { id: setId } = req.params;
    const userId = req.user.userId;
    const { exercise, sets, reps, weightKg, date } = req.body;

    const existingSet = await prisma.set.findUnique({
      where: { setId },
      include: { workout: true }
    });

    if (!existingSet || existingSet.workout.userId !== userId) {
      return res.status(404).json({ error: 'Set not found or unauthorized' });
    }

    if (existingSet.workout.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot edit sets in a completed workout' });
    }

    // Whitelist updatable fields so clients can't change workoutId, setId, etc.
    const data = {
      ...(exercise !== undefined && { exercise }),
      ...(sets !== undefined && { sets }),
      ...(reps !== undefined && { reps }),
      ...(weightKg !== undefined && { weightKg }),
      ...(date !== undefined && { date: new Date(date) })
    };

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updatedSet = await prisma.set.update({
      where: { setId },
      data
    });

    res.status(200).json(updatedSet);
  } catch (error) {
    console.error('[Set Controller] Update Set Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteSet = async (req, res) => {
  try {
    const { id: setId } = req.params;
    const userId = req.user.userId;

    const existingSet = await prisma.set.findUnique({
      where: { setId },
      include: { workout: true }
    });

    if (!existingSet || existingSet.workout.userId !== userId) {
      return res.status(404).json({ error: 'Set not found or unauthorized' });
    }

    if (existingSet.workout.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot delete sets in a completed workout' });
    }

    await prisma.set.delete({ where: { setId } });

    res.status(200).json({ message: 'Set deleted successfully' });
  } catch (error) {
    console.error('[Set Controller] Delete Set Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};