const express = require('express');
const router = express.Router();
const { getMemberStats, getRepoStats} = require('../controllers/githubController');
const { authenticateUser } = require('../middleware/auth');

router.get('/member-stats/:username/:repoName/:githubUsername', getMemberStats);
router.get('/repo-stats/:username/:repoName', getRepoStats);
// router.get('/profile-stats', authenticateUser, getProfileData);

module.exports = router;
