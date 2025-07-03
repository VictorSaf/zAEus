require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const activityRoutes = require('./routes/activity');
const skillsRoutes = require('./routes/skills');
const { authenticateToken } = require('./middleware/auth');
const { activityLogger } = require('./middleware/activityLogger');
const initDatabase = require('./config/init-db-sqlite');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Middleware pentru logarea activității (aplicat global)
app.use(activityLogger);

app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/activity', authenticateToken, activityRoutes);
app.use('/api/skills', skillsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

async function startServer() {
  try {
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();