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

    try {
      // Fetch all data in parallel
      const [allCommitsResult, issuesResult, pullsResult, weeklyCommitsResult] = await Promise.all([
        githubService.fetchAllCommits(username, repoName),
        githubService.fetchIssues(username, repoName),
        githubService.fetchPullRequests(username, repoName),
        githubService.fetchWeeklyCommits(username, repoName, since, until)
      ]);

      // Check and extract data and metadata
      const allCommits = allCommitsResult?.data || [];
      const issues = issuesResult?.data || [];
      const pulls = pullsResult?.data || [];
      const weeklyCommits = weeklyCommitsResult?.data || [];
      
      // Get timestamps, with safeguards in case metadata is missing
      const timestamps = [
          allCommitsResult?.metadata?.timestamp, 
          issuesResult?.metadata?.timestamp, 
          pullsResult?.metadata?.timestamp, 
          weeklyCommitsResult?.metadata?.timestamp
      ].filter(Boolean); // Remove any undefined/null values
      
      // Use the earliest timestamp as lastUpdated, or current time if no timestamps
      const lastUpdated = timestamps.length > 0 ? timestamps.sort()[0] : new Date().toISOString();
      
      // Process commit data for chart
      const dailyCommits = processCommitData(weeklyCommits, today);

      // Check if we're using cached data and get the timestamp
      const todayDate = today.toISOString().split('T')[0];
      const cacheKey = `github:weekly:${username}:${repoName}:last7days:${todayDate}`;
      const cacheExists = await getCachedData(cacheKey) !== null;

      res.json({
        success: true,
        data: {
          commitCount: Array.isArray(allCommits) ? allCommits.length : 0,
          issueCount: Array.isArray(issues) ? issues.length : 0,
          pullCount: Array.isArray(pulls) ? pulls.length : 0,
          dailyCommits,
          lastUpdated: lastUpdated,
          isCached: cacheExists
        }
      });
    } catch (innerError) {
      console.error('Error processing GitHub data:', innerError);
      throw new Error(`Failed to process GitHub data: ${innerError.message}`);
    }
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

    try {
      // Fetch all member data in parallel
      const [commitsResult, issuesResult, pullRequestsResult] = await Promise.all([
        githubService.fetchMemberCommits(username, repoName, githubUsername),
        githubService.fetchMemberIssues(username, repoName, githubUsername),
        githubService.fetchMemberPullRequests(username, repoName, githubUsername)
      ]);

      // Extract data and metadata with safe fallbacks
      const commits = commitsResult?.data || [];
      const issues = issuesResult?.data || { open: 0, closed: 0 };
      const pullRequests = pullRequestsResult?.data || { open: 0, closed: 0, merged: 0 };

      // Get the earliest timestamp to use as lastUpdated, with fallbacks
      const timestamps = [
        commitsResult?.metadata?.timestamp,
        issuesResult?.metadata?.timestamp, 
        pullRequestsResult?.metadata?.timestamp
      ].filter(Boolean); // Remove any undefined/null values
      
      const lastUpdated = timestamps.length > 0 ? timestamps.sort()[0] : new Date().toISOString();

      // Check if we're using cached data
      const commitsCacheKey = `github:member:commits:${username}:${repoName}:${githubUsername}:${todayDate}`;
      const commitsCached = await getCachedData(commitsCacheKey) !== null;

      res.json({
        success: true,
        data: {
          commits: Array.isArray(commits) ? commits.length : 0,
          last_commit: Array.isArray(commits) && commits[0]?.commit?.author?.date || null,
          open_issues: issues.open || 0,
          closed_issues: issues.closed || 0,
          open_prs: pullRequests.open || 0,
          closed_prs: pullRequests.closed || 0,
          merged_prs: pullRequests.merged || 0,
          lastUpdated: lastUpdated,
          isCached: commitsCached
        }
      });
    } catch (innerError) {
      console.error('Error processing member data:', innerError);
      throw new Error(`Failed to process member data: ${innerError.message}`);
    }
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
  // Defensive check to ensure commits is an array
  if (!commits || !Array.isArray(commits)) {
    console.warn('processCommitData received invalid data:', commits);
    commits = []; // Default to empty array to avoid errors
  }

  console.log(`Processing ${commits.length} commits for chart`);

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
    try {
      if (commit && commit.commit && commit.commit.author && commit.commit.author.date) {
        const commitDate = new Date(commit.commit.author.date);
        const dateStr = commitDate.toISOString().split('T')[0];
        if (dailyCommits.hasOwnProperty(dateStr)) {
          dailyCommits[dateStr]++;
        }
      }
    } catch (error) {
      console.error('Error processing commit:', error);
    }
  });

  console.log('Daily commit counts:', dailyCommits);

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

