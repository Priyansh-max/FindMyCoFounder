require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const profileRoutes = require('./routes/profileRoutes');
const emailValidation = require('./validate/emailValidation');
const ideaValidation = require('./validate/ideaValidation');
const profileValidation = require('./validate/profileValidation');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logging

// Routes
app.use('/api/profile', profileRoutes);
app.use('/api/validate', emailValidation);
app.use('/api/validate', ideaValidation);
app.use('/api/validate', profileValidation);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 