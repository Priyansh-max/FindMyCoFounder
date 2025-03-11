const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { getStats } = require('../controllers/numberController');
const { getApplicationStats } = require('../controllers/numberController');

// Route to get all statistics
router.get('/stats', authenticateUser, getStats);
router.get('/application-stats/:ideaId', authenticateUser, getApplicationStats);

module.exports = router;

