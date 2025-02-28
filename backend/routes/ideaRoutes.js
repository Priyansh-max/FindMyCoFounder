const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { createIdea, updateIdea, getIdeabyUser, getIdeas, updateIdeaStatus, deleteIdea } = require('../controllers/ideaController');

router.post('/create', authenticateUser, createIdea);
router.put('/update', authenticateUser, updateIdea);
router.get('/user', authenticateUser, getIdeabyUser);
router.get('/', authenticateUser, getIdeas);
router.put('/status/:id', authenticateUser, updateIdeaStatus);
router.delete('/:id', authenticateUser, deleteIdea);

module.exports = router;    
