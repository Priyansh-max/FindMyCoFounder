const axios = require('axios');
const { getCachedData, setCachedData } = require('./caching');

const GITHUB_API_BASE = 'https://api.github.com';

class GitHubService {
  constructor(token) {
    this.token = token;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    };
  }

  async fetchAllCommits(username, repoName, perPage = 100) {
    // Use a day-based cache key instead of exact timestamps
    const todayDate = new Date().toISOString().split('T')[0];
    const cacheKey = `github:commits:${username}:${repoName}:${todayDate}`;
    
    // Check cache first
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    let page = 1;
    let allCommits = [];
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get(
        `${GITHUB_API_BASE}/repos/${username}/${repoName}/commits`,
        {
          headers: this.headers,
          params: { per_page: perPage, page }
        }
      );

      const commits = response.data;
      allCommits.push(...commits);

      hasMore = commits.length === perPage;
      page++;
    }

    // Cache the results
    await setCachedData(cacheKey, allCommits);
    return {
        data: allCommits,
        metadata: {
          timestamp: new Date().toISOString()
        }
    };
  }

  async fetchIssues(username, repoName) {
    // Use a day-based cache key instead of exact timestamps
    const todayDate = new Date().toISOString().split('T')[0];
    const cacheKey = `github:issues:${username}:${repoName}:${todayDate}`;
    
    // Check cache first
    const cachedResult = await getCachedData(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const response = await axios.get(
      `${GITHUB_API_BASE}/repos/${username}/${repoName}/issues?state=all`,
      { headers: this.headers }
    );

    // Cache the results
    await setCachedData(cacheKey, response.data);
    
    // Return with metadata for immediate use
    return {
      data: response.data,
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }

  async fetchPullRequests(username, repoName) {
    // Use a day-based cache key instead of exact timestamps
    const todayDate = new Date().toISOString().split('T')[0];
    const cacheKey = `github:pulls:${username}:${repoName}:${todayDate}`;
    
    // Check cache first
    const cachedResult = await getCachedData(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const response = await axios.get(
      `${GITHUB_API_BASE}/repos/${username}/${repoName}/pulls`,
      { headers: this.headers }
    );

    // Cache the results
    await setCachedData(cacheKey, response.data);
    
    // Return with metadata for immediate use
    return {
      data: response.data,
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }

  async fetchWeeklyCommits(username, repoName, since, until) {
    // Generate a stable cache key by using only the date portion (YYYY-MM-DD)
    // This ensures the same cache is used for requests on the same day
    const todayDate = new Date().toISOString().split('T')[0];
    const cacheKey = `github:weekly:${username}:${repoName}:last7days:${todayDate}`;
    
    // Check cache first
    const cachedResult = await getCachedData(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Implement pagination to get all commits in the date range
    let page = 1;
    let allCommits = [];
    let hasMore = true;
    const perPage = 100; // Maximum allowed by GitHub API

    while (hasMore) {
      try {
        const response = await axios.get(
          `${GITHUB_API_BASE}/repos/${username}/${repoName}/commits`,
          {
            headers: this.headers,
            params: { 
              since, 
              until,
              per_page: perPage,
              page
            }
          }
        );

        const commits = response.data;
        if (commits && Array.isArray(commits)) {
          allCommits.push(...commits);
        }

        // Check if there are more pages to fetch
        hasMore = commits.length === perPage;
        page++;
        
        // Add safety mechanism to prevent infinite loops
        if (page > 10) {
          console.warn(`Reached maximum page limit (10) for weekly commits of ${username}/${repoName}`);
          hasMore = false;
        }
      } catch (error) {
        console.error(`Error fetching weekly commits page ${page}:`, error);
        hasMore = false; // Stop on error
      }
    }

    console.log(`Fetched ${allCommits.length} weekly commits for ${username}/${repoName}`);

    // Cache the results
    await setCachedData(cacheKey, allCommits);
    
    // Return with metadata for immediate use
    return {
      data: allCommits,
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }

  async fetchMemberCommits(username, repoName, githubUsername) {
    // Use a day-based cache key instead of exact timestamps
    const todayDate = new Date().toISOString().split('T')[0];
    const cacheKey = `github:member:commits:${username}:${repoName}:${githubUsername}:${todayDate}`;
    
    // Check cache first
    const cachedResult = await getCachedData(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    let page = 1;
    let allCommits = [];
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get(
        `${GITHUB_API_BASE}/repos/${username}/${repoName}/commits`,
        {
          headers: this.headers,
          params: { 
            per_page: 100, 
            page,
            author: githubUsername 
          }
        }
      );

      const commits = response.data;
      allCommits.push(...commits);

      hasMore = commits.length === 100;
      page++;
    }

    // Cache the results
    await setCachedData(cacheKey, allCommits);
    
    // Return with metadata for immediate use
    return {
      data: allCommits,
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }

  async fetchMemberIssues(username, repoName, githubUsername) {
    // Use a day-based cache key instead of exact timestamps
    const todayDate = new Date().toISOString().split('T')[0];
    const cacheKey = `github:member:issues:${username}:${repoName}:${githubUsername}:${todayDate}`;
    
    // Check cache first
    const cachedResult = await getCachedData(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const [openIssues, closedIssues] = await Promise.all([
      axios.get(
        `${GITHUB_API_BASE}/search/issues?q=repo:${username}/${repoName}+author:${githubUsername}+type:issues+state:open`,
        { headers: this.headers }
      ),
      axios.get(
        `${GITHUB_API_BASE}/search/issues?q=repo:${username}/${repoName}+author:${githubUsername}+type:issues+state:closed`,
        { headers: this.headers }
      )
    ]);

    const result = {
      open: openIssues.data.total_count,
      closed: closedIssues.data.total_count
    };

    // Cache the results
    await setCachedData(cacheKey, result);
    
    // Return with metadata for immediate use
    return {
      data: result,
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }

  async fetchMemberPullRequests(username, repoName, githubUsername) {
    // Use a day-based cache key instead of exact timestamps
    const todayDate = new Date().toISOString().split('T')[0];
    const cacheKey = `github:member:prs:${username}:${repoName}:${githubUsername}:${todayDate}`;
    
    // Check cache first
    const cachedResult = await getCachedData(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const [openPRs, closedPRs] = await Promise.all([
      axios.get(
        `${GITHUB_API_BASE}/search/issues?q=repo:${username}/${repoName}+author:${githubUsername}+type:pr+state:open`,
        { headers: this.headers }
      ),
      axios.get(
        `${GITHUB_API_BASE}/search/issues?q=repo:${username}/${repoName}+author:${githubUsername}+type:pr+state:closed`,
        { headers: this.headers }
      )
    ]);

    const result = {
      open: openPRs.data.total_count,
      closed: closedPRs.data.total_count,
      merged: closedPRs.data.items.filter(item => 
        item.pull_request && item.pull_request.merged_at
      ).length
    };

    // Cache the results
    await setCachedData(cacheKey, result);
    
    // Return with metadata for immediate use
    return {
      data: result,
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }
}

module.exports = GitHubService; 