const express = require('express');
const router = express.Router();
const { authenticateUserisAdmin } = require('../middleware/admin');
const { getSubmissions , approveSubmission } = require('../controllers/adminController');

router.get('/submissions' , authenticateUserisAdmin , getSubmissions);
router.put('/submissions/:id' , authenticateUserisAdmin , approveSubmission);

module.exports = router;

