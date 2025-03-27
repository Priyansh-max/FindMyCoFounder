const express = require('express');
const router = express.Router();
const { getMemberStats, getRepoStats} = require('../controllers/githubController');

router.get('/member-stats/:username/:repoName/:githubUsername/:joinedAt', getMemberStats);
router.get('/repo-stats/:username/:repoName/:repoConnectedAt', getRepoStats);
// router.get('/profile-stats', authenticateUser, getProfileData);

module.exports = router;
