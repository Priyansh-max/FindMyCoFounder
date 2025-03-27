const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const router = express.Router();
const { submitProject, uploadLogo } = require('../controllers/projectSubmitController');
const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 1 * 1024 * 1024 // 1MB limit
    }
  });

router.post('/submit-project', authenticateUser , submitProject);
router.post('/logo-upload' , authenticateUser , upload.single('logo'), uploadLogo);

module.exports = router;