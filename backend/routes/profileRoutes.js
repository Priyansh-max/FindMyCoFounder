const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { 
  createProfile, 
  updateProfile, 
  getProfile, 
  uploadResume,
  getProjectStats,
  getProjectDetails
} = require('../controllers/profileController');

const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Profile Routes
router.post('/create', authenticateUser, createProfile);
router.put('/update', authenticateUser, updateProfile);
router.get('/details', authenticateUser, getProfile); //imp
router.post('/resume', authenticateUser, upload.single('resume'), uploadResume);
router.get('/get-project-stats', authenticateUser, getProjectStats);
router.get('/get-project-details', authenticateUser, getProjectDetails);

module.exports = router; 