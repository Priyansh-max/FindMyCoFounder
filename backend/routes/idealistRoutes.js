const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { verifyOnboarding , applyToIdea } = require('../controllers/idealistController');

router.get('/verify-onboarding', authenticateUser, verifyOnboarding);
router.post('/apply/:ideaId' , authenticateUser, applyToIdea);

module.exports = router;