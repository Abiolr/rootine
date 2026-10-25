import express from 'express';
import cors from 'cors';
import { prisma } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import setRoutes from './routes/set.routes.js';
import workoutRoutes from './routes/workout.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    api: 'Rootine API',
    version: '1.0.0',
    endpoints: '/api-docs'
  });
});

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: 'ok',
      database: 'connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Health Check] Database Connection Failed:', error);
    res.status(503).json({ 
      status: 'error',
      database: 'disconnected',
      error: error.message
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sets', setRoutes);
app.use('/api/workouts', workoutRoutes);

export default app;