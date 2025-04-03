const GitHubService = require('../services/githubService');
const { getCachedData } = require('../services/caching');

const getRepoStats = async (req, res) => {
  try {
    console.log("Request received for getRepoStats");
    console.log("Route params:", req.params);
    console.log("Query params:", req.query);
    
    const { username, repoName, repoConnectedAt } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    const Cache = req.query.cache;
    //if cache says true -- means we say that we dont want to use cache
    //if cache says false -- means we say that we want to use cache

    console.log("Extracted values:", {
      username,
      repoName,
      repoConnectedAt,
      hasToken: !!token,
      Cache
    });

    if (!token) {
      return res.status(401).json({ error: 'GitHub token is required' });
    }

    const githubService = new GitHubService(token , Cache);
    
    // Set up date ranges
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // For fetchAllCommitsSince: use repoConnectedAt
    let connectionDate = null;
    let useConnectionDate = false;
    let weeklyStartDate = lastWeek;

    if (repoConnectedAt) {
      console.log("repoConnectedAt from params:", repoConnectedAt);
      connectionDate = new Date(repoConnectedAt);
      
      if (!isNaN(connectionDate.getTime())) {
        useConnectionDate = true;
        connectionDate.setDate(connectionDate.getDate());

        // Calculate days since connection
        const daysSinceConnection = Math.floor((today - connectionDate) / (1000 * 60 * 60 * 24));
        console.log("Days since connection:", daysSinceConnection);

        // If repo was connected less than 7 days ago, adjust the weekly start date
        if (daysSinceConnection < 7) {
          weeklyStartDate = connectionDate;
          console.log("Using connection date for weekly stats as it's less than 7 days old");
        }
      }
    }

    console.log("Original connection date:", repoConnectedAt);
    console.log("Adjusted connection date for all commits:", connectionDate?.toISOString());
    console.log("Weekly stats start date:", weeklyStartDate.toISOString());

    try {
      // Fetch all data in parallel
      const [allCommitsResult, issuesResult, pullsResult, weeklyCommitsResult] = await Promise.all([
          githubService.fetchAllCommitsSince(username, repoName, connectionDate.toISOString()),
          githubService.fetchIssuesSince(username, repoName, connectionDate.toISOString()),
          githubService.fetchPullRequestsSince(username, repoName, connectionDate.toISOString()),
          githubService.fetchWeeklyCommits(username, repoName, weeklyStartDate.toISOString(), today.toISOString())
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
      ].filter(Boolean);
      
      // Use the earliest timestamp as lastUpdated, or current time if no timestamps
      const lastUpdated = timestamps.length > 0 ? timestamps.sort()[0] : new Date().toISOString();
      
      // Process commit data for chart with adjusted date range
      const dailyCommits = processCommitData(weeklyCommits, today, weeklyStartDate);

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
          isCached: cacheExists,
          since: connectionDate?.toISOString() || lastWeek.toISOString(),
          useConnectionDate,
          daysTracked: Math.floor((today - weeklyStartDate) / (1000 * 60 * 60 * 24)) + 1
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
    const { username, repoName, githubUsername, joinedAt } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    const Cache = req.query.cache;

    console.log("Request received for getMemberStats");
    console.log("Query params:", req.query);
    console.log("Force no cache:", Cache);

    if (!token) {
      return res.status(401).json({ error: 'GitHub token is required' });
    }

    const githubService = new GitHubService(token , Cache);

    const today = new Date();
    const todayDate = today.toISOString().split('T')[0];

    // Set up join date for fetching stats
    let joinDate = null;
    let useJoinDate = false;
    if (joinedAt) {
      console.log("joinedAt from params:", joinedAt);
      joinDate = new Date(joinedAt);
      if (!isNaN(joinDate.getTime())) {
        useJoinDate = true;
        joinDate.setDate(joinDate.getDate()); // Start from one day before join date
      }
    }

    console.log("Original join date:", joinedAt);
    console.log("Adjusted join date for member stats:", joinDate?.toISOString());

    try {
      // Fetch all member data in parallel
      const [commitsResult, issuesResult, pullRequestsResult] = await Promise.all([
          githubService.fetchMemberCommitsSince(username, repoName, githubUsername, joinDate.toISOString()),
          githubService.fetchMemberIssuesSince(username, repoName, githubUsername, joinDate.toISOString()),
          githubService.fetchMemberPullRequestsSince(username, repoName, githubUsername, joinDate.toISOString())
      ]);

      // Extract data and metadata with safe fallbacks
      const commits = commitsResult?.data || [];
      const issues = issuesResult?.data || { open: 0, closed: 0 };
      const pullRequests = pullRequestsResult?.data || { open: 0, closed: 0, merged: 0 };

      // Calculate inactivity with improved logic
      let inactivityCount = 0;
      const lastCommitDate = Array.isArray(commits) && commits[0]?.commit?.author?.date;
      
      if (lastCommitDate) {
        const lastCommit = new Date(lastCommitDate);
        const daysSinceLastCommit = Math.floor((today - lastCommit) / (1000 * 60 * 60 * 24));
        
        // Check for recent activity in PRs or issues
        const hasRecentActivity = (() => {
          const recentPRs = pullRequests.items?.some(pr => {
            const prDate = new Date(pr.created_at);
            return prDate > lastCommit;
          });

          const recentIssues = issues.items?.some(issue => {
            const issueDate = new Date(issue.created_at);
            return issueDate > lastCommit;
          });

          return recentPRs || recentIssues;
        })();

        // Calculate inactivity only if there's no recent activity
        if (!hasRecentActivity) {
          if (daysSinceLastCommit > 3) {
            // Initial inactivity count after 3 days
            inactivityCount = 1;
            
            // Add additional counts for every 2 days after
            const additionalDays = daysSinceLastCommit - 3;
            if (additionalDays > 0) {
              inactivityCount += Math.floor(additionalDays / 2);
            }
          }
        }
      }

      // Get the earliest timestamp to use as lastUpdated, with fallbacks
      const timestamps = [
        commitsResult?.metadata?.timestamp,
        issuesResult?.metadata?.timestamp, 
        pullRequestsResult?.metadata?.timestamp
      ].filter(Boolean);
      
      const lastUpdated = timestamps.length > 0 ? timestamps.sort()[0] : new Date().toISOString();

      // Check if we're using cached data
      const commitsCacheKey = `github:member:commits:${username}:${repoName}:${githubUsername}:${todayDate}`;
      const commitsCached = await getCachedData(commitsCacheKey) !== null;

      res.json({
        success: true,
        data: {
          commits: Array.isArray(commits) ? commits.length : 0,
          last_commit: lastCommitDate || null,
          open_issues: issues.open || 0,
          closed_issues: issues.closed || 0,
          open_prs: pullRequests.open || 0,
          closed_prs: pullRequests.closed || 0,
          merged_prs: pullRequests.merged || 0,
          inactivity_count: inactivityCount,
          lastUpdated: lastUpdated,
          isCached: commitsCached,
          since: joinDate?.toISOString(),
          useJoinDate
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

// Helper function to process commit data for chart with adjusted date range
const processCommitData = (commits, today, startDate) => {
  // Defensive check to ensure commits is an array
  if (!commits || !Array.isArray(commits)) {
    console.warn('processCommitData received invalid data:', commits);
    commits = [];
  }

  console.log(`Processing ${commits.length} commits for chart`);

  const dailyCommits = {};
  const labels = [];
  const commitCounts = [];

  // Calculate number of days to show
  const daysToShow = Math.min(
    7,
    Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1
  );

  // Initialize all days with 0 commits
  for (let i = daysToShow - 1; i >= 0; i--) {
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

