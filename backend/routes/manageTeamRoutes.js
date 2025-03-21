const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const router = express.Router();
const { createTeam } = require('../controllers/managerTeamController');
const { checkTeam } = require('../controllers/managerTeamController');
const { updateTeam } = require('../controllers/managerTeamController');
const { getTeam } = require('../controllers/managerTeamController');
const { contactInfo } = require('../controllers/managerTeamController');

router.post('/create-team/:id',authenticateUser, createTeam);
router.get('/check-team/:id',authenticateUser, checkTeam);
router.put('/update-team/:id' , authenticateUser, updateTeam);
router.get('/get-team/:id',authenticateUser, getTeam);
router.put('/contact-info/:id' , authenticateUser, contactInfo);

module.exports = router;
