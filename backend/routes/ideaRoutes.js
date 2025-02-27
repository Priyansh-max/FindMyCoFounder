const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { createIdea, updateIdea, getIdeabyUser, getIdeas } = require('../controllers/ideaController');

router.post('/create', authenticateUser, createIdea);
router.put('/update', authenticateUser, updateIdea);
router.get('/:id', authenticateUser, getIdeabyUser);
router.get('/', authenticateUser, getIdeas);

module.exports = router;    
