require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const profileRoutes = require('./routes/profileRoutes');
const emailValidation = require('./validate/emailValidation');
const ideaValidation = require('./validate/ideaValidation');
const profileValidation = require('./validate/profileValidation');
const ideaRoutes = require('./routes/ideaRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const NumberRoutes = require('./routes/numberRoutes');
const manageTeamRoutes = require('./routes/manageTeamRoutes');
const githubRoutes = require('./routes/githubRoutes');
const projectValidation = require('./validate/projectValidation');
const pitchValidation = require('./validate/pitchValidation');
const projectSubmitRoutes = require('./routes/projectSubmitRoutes');
const adminRoutes = require('./routes/adminRoutes');
const idealistRoutes = require('./routes/idealistRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logging

// Routes
//make a default / route which says hi
app.get('/', (req, res) => {
  res.send('Hi');
});

// Temporary Redis health check endpoint
app.get('/health/redis', async (req, res) => {
  try {
    const { client } = require('./services/caching');
    
    // Check Redis status
    const status = client.status;
    const info = {
      status: status,
      uptime: process.uptime(),
      redis_url_configured: !!process.env.REDIS_URL,
      timestamp: new Date().toISOString()
    };
    
    if (status === 'ready') {
      // Try a simple operation
      await client.ping();
      await client.set('health_check', 'ok', 'EX', 10);
      const result = await client.get('health_check');
      
      info.ping_success = true;
      info.set_get_success = result === 'ok';
    }
    
    res.json(info);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      redis_status: 'error',
      timestamp: new Date().toISOString()
    });
  }
});

app.use('/api/profile', profileRoutes);
app.use('/api/validate', emailValidation);
app.use('/api/validate', ideaValidation);
app.use('/api/validate', profileValidation);
app.use('/api/validate', projectValidation);
app.use('/api/validate', pitchValidation);
app.use('/api/idea', ideaRoutes);
app.use('/api/application', applicationRoutes);
app.use('/api/data', NumberRoutes);
app.use('/api/manage-team', manageTeamRoutes);
app.use('/api/github' , githubRoutes);
app.use('/api/project-submit', projectSubmitRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/idealist', idealistRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0',() => {
  console.log(`Server is running on port ${PORT}`);
}); 