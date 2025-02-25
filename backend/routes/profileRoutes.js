const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { 
  createProfile, 
  updateProfile, 
  getProfile, 
  uploadResume,
  verifyEmail,
  verifyPhone,
  updateSkills
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
router.get('/:userId', authenticateUser, getProfile);

// Skills Routes
router.put('/skills', authenticateUser, updateSkills);

// Resume Upload Route
router.post('/resume', authenticateUser, upload.single('resume'), uploadResume);

// Verification Routes
router.post('/verify-email', authenticateUser, verifyEmail);
router.post('/verify-phone', authenticateUser, verifyPhone);

module.exports = router; 