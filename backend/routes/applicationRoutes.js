const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { createApplication, updateApplication, getApplicationbyUser , getApplicationbyIdea, acceptApplication, rejectApplication} = require('../controllers/applicationController');

router.post('/create', authenticateUser, createApplication);
router.put('/update', authenticateUser, updateApplication);
router.get('/user', authenticateUser, getApplicationbyUser);
router.get('/details/:id', authenticateUser, getApplicationbyIdea);
router.put('/accept/:id', authenticateUser, acceptApplication);
router.put('/reject/:id', authenticateUser, rejectApplication);

module.exports = router;    
