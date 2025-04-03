const express = require('express');
const router = express.Router();
const { authenticateUserisAdmin } = require('../middleware/admin');
const { getSubmissions } = require('../controllers/adminController');

router.get('/submissions' , authenticateUserisAdmin , getSubmissions);

module.exports = router;

