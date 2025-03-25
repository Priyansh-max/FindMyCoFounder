const GitHubService = require('../services/githubService');
const { getCachedData } = require('../services/caching');

const getRepoStats = async (req, res) => {
  try {
    const { username, repoName } = req.params;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'GitHub token is required' });
    }

    const githubService = new GitHubService(token);

    // Set up date range for commit history
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const since = lastWeek.toISOString();
    const until = today.toISOString();

    // Fetch all data in parallel
    const [allCommits, issues, pulls, weeklyCommits] = await Promise.all([
      githubService.fetchAllCommits(username, repoName),
      githubService.fetchIssues(username, repoName),
      githubService.fetchPullRequests(username, repoName),
      githubService.fetchWeeklyCommits(username, repoName, since, until)
    ]);

    // Process commit data for chart
    const dailyCommits = processCommitData(weeklyCommits, today);

    // Check if we're using cached data and get the timestamp
    const todayDate = today.toISOString().split('T')[0];
    const cacheKey = `github:weekly:${username}:${repoName}:last7days:${todayDate}`;
    const cacheExists = await getCachedData(cacheKey) !== null;

    res.json({
      success: true,
      data: {
        commitCount: allCommits.length,
        issueCount: issues.length,
        pullCount: pulls.length,
        dailyCommits,
        lastUpdated: new Date().toISOString(),
        isCached: cacheExists
      }
    });
  } catch (error) {
    console.error('Error fetching repository data:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch repository statistics' 
    });
  }
};

const getMemberStats = async (req, res) => {
  try {
    const { username, repoName, githubUsername } = req.params;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'GitHub token is required' });
    }

    const githubService = new GitHubService(token);
    const todayDate = new Date().toISOString().split('T')[0];

    // Fetch all member data in parallel
    const [commits, issues, pullRequests] = await Promise.all([
      githubService.fetchMemberCommits(username, repoName, githubUsername),
      githubService.fetchMemberIssues(username, repoName, githubUsername),
      githubService.fetchMemberPullRequests(username, repoName, githubUsername)
    ]);

    // Check if we're using cached data
    const commitsCacheKey = `github:member:commits:${username}:${repoName}:${githubUsername}:${todayDate}`;
    const commitsCached = await getCachedData(commitsCacheKey) !== null;

    res.json({
      success: true,
      data: {
        commits: commits.length,
        last_commit: commits[0]?.commit?.author?.date || null,
        open_issues: issues.open,
        closed_issues: issues.closed,
        open_prs: pullRequests.open,
        closed_prs: pullRequests.closed,
        merged_prs: pullRequests.merged,
        lastUpdated: new Date().toISOString(),
        isCached: commitsCached
      }
    });
  } catch (error) {
    console.error('Error fetching member statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch member statistics' 
    });
  }
};

// Helper function to process commit data for chart
const processCommitData = (commits, today) => {
  const dailyCommits = {};
  const labels = [];
  const commitCounts = [];

  // Initialize all days with 0 commits
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
    dailyCommits[dateStr] = 0;
    labels.push(formattedDate);
  }

  // Count commits for each day
  commits.forEach(commit => {
    const commitDate = new Date(commit.commit.author.date);
    const dateStr = commitDate.toISOString().split('T')[0];
    if (dailyCommits.hasOwnProperty(dateStr)) {
      dailyCommits[dateStr]++;
    }
  });

  // Convert to chart format
  Object.values(dailyCommits).forEach(count => {
    commitCounts.push(count);
  });

  return {
    labels,
    datasets: [{
      label: 'Total Commits',
      data: commitCounts,
      backgroundColor: '#9AE65C',
      hoverBackgroundColor: '#8BD84D',
      borderRadius: 4,
      borderWidth: 0,
    }]
  };
};

module.exports = {
    getRepoStats,
    getMemberStats
};

