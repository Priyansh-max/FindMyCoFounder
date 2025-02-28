const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { getStats } = require('../controllers/numberController');

// Route to get all statistics
router.get('/stats', authenticateUser, getStats);

module.exports = router;
