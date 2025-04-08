//we only need the function which have since in the params

const axios = require('axios');
const { getCachedData, setCachedData } = require('./caching');

const GITHUB_API_BASE = 'https://api.github.com';

class GitHubService {
  constructor(token, Cache) {
    this.token = token;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    };
    this.Caching = Cache; // Flag to disable caching
  }

  async fetchAllCommitsSince(username, repoName, since, perPage = 100) {

    // Use a day-based cache key with the since date
    const todayDate = new Date().toISOString().split('T')[0];
    const sinceDate = new Date(since).toISOString().split('T')[0];
    const cacheKey = `github:commits:${username}:${repoName}:${todayDate}:since:${sinceDate}`;
    
    // Check cache first (unless caching is disabled)
    //so if disableCache is true, then we don't check the cache
    //and if its false, then we check the cache
    if (this.Caching === 'true') {
      console.log("hiiii");
      const cachedData = await getCachedData(cacheKey);
      if (cachedData) {
        console.log("hiii11111");
        return cachedData;
      }
    }

    // If no cached data, fetch from API with since parameter
    let page = 1;
    let allCommits = [];
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await axios.get(
          `${GITHUB_API_BASE}/repos/${username}/${repoName}/commits`,
          {
            headers: this.headers,
            params: { 
              per_page: perPage, 
              page,
              since: since // Use the since parameter to filter commits
            }
          }
        );

        const commits = response.data;
        allCommits.push(...commits);

        hasMore = commits.length === perPage;
        page++;
        
        // Safety check to prevent too many requests
        if (page > 10) {
          console.warn(`Reached maximum page limit (10) for repo ${username}/${repoName}`);
          hasMore = false;
        }
      } catch (error) {
        console.error(`Error fetching commits for page ${page}:`, error);
        hasMore = false;
      }
    }

    // Cache the results
    await setCachedData(cacheKey, allCommits);
    return {
      data: allCommits,
      metadata: {
        timestamp: new Date().toISOString(),
        fromCache: false,
        sinceDate: since
      }
    };
  }

  async fetchWeeklyCommits(username, repoName, since, until) {
    // Generate a stable cache key by using only the date portion (YYYY-MM-DD)
    // This ensures the same cache is used for requests on the same day
    const todayDate = new Date().toISOString().split('T')[0];
    const cacheKey = `github:weekly:${username}:${repoName}:last7days:${todayDate}`;
    
    // Check cache first (unless caching is disabled)
    if (this.Caching === 'true') {
      const cachedResult = await getCachedData(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
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


    //cache data everytime we fetch the data.. only get it when disableCache is true
    await setCachedData(cacheKey, allCommits);
    // Return with metadata for immediate use
    return {
      data: allCommits,
      metadata: {
        timestamp: new Date().toISOString(),
        fromCache: false
      }
    };
  }

  async fetchIssuesSince(username, repoName, since) {
    // Use a day-based cache key with the since date
    const todayDate = new Date().toISOString().split('T')[0];
    const sinceDateStr = new Date(since).toISOString().split('T')[0];
    const cacheKey = `github:issues:${username}:${repoName}:${todayDate}:since:${sinceDateStr}`;
    
    // Check cache first (unless caching is disabled)
    if (this.Caching === 'true') {
      const cachedResult = await getCachedData(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    const response = await axios.get(
      `${GITHUB_API_BASE}/repos/${username}/${repoName}/issues`,
      { 
        headers: this.headers,
        params: {
          since: since,
          state: 'all',
          per_page: 100
        }
      }
    );

    // Cache the results if caching is enabled
    await setCachedData(cacheKey, response.data);

    return {
      data: response.data,
      metadata: {
        timestamp: new Date().toISOString(),
        fromCache: false,
        sinceDate: since
      }
    };
  }

  async fetchPullRequestsSince(username, repoName, since) {
    // Use a day-based cache key with the since date
    const todayDate = new Date().toISOString().split('T')[0];
    const sinceDateStr = new Date(since).toISOString().split('T')[0];
    const cacheKey = `github:pulls:${username}:${repoName}:${todayDate}:since:${sinceDateStr}`;
    
    // Check cache first (unless caching is disabled)
    if (this.Caching === 'true') {
      const cachedResult = await getCachedData(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    const response = await axios.get(
      `${GITHUB_API_BASE}/repos/${username}/${repoName}/pulls`,
      { 
        headers: this.headers,
        params: {
          state: 'all',
          sort: 'created',
          direction: 'desc',
          per_page: 100
        }
      }
    );

    // Filter pulls created after the since date
    const compareDate = new Date(since);
    const filteredPulls = response.data.filter(pull => {
      const pullDate = new Date(pull.created_at);
      return pullDate >= compareDate;
    });

    // Cache the filtered results if caching is enabled
    await setCachedData(cacheKey, filteredPulls);

    
    return {
      data: filteredPulls,
      metadata: {
        timestamp: new Date().toISOString(),
        fromCache: false,
        sinceDate: since
      }
    };
  }

  async fetchMemberCommitsSince(username, repoName, githubUsername, since, from) {
    // Use a day-based cache key with the since date
    const todayDate = new Date().toISOString().split('T')[0];
    const sinceDateStr = new Date(since).toISOString().split('T')[0];
    const cacheKey = `github:member:commits:${username}:${repoName}:${githubUsername}:${todayDate}:since:${sinceDateStr}:${from}`;
    
    // Check cache first (unless caching is disabled)
    if (this.Caching === 'true') {
      const cachedResult = await getCachedData(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
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
            author: githubUsername,
            since: since
          }
        }
      );

      const commits = response.data;
      allCommits.push(...commits);

      hasMore = commits.length === 100;
      page++;
      
      // Safety check to prevent too many requests
      if (page > 10) {
        console.warn(`Reached maximum page limit (10) for member commits of ${githubUsername}`);
        hasMore = false;
      }
    }

    // Cache the results if caching is enabled

    await setCachedData(cacheKey, allCommits);
    
    return {
      data: allCommits,
      metadata: {
        timestamp: new Date().toISOString(),
        fromCache: false,
        sinceDate: since
      }
    };
  }

  async fetchMemberIssuesSince(username, repoName, githubUsername, since, from) {
    // Use a day-based cache key with the since date
    const todayDate = new Date().toISOString().split('T')[0];
    const sinceDateStr = new Date(since).toISOString().split('T')[0];
    const cacheKey = `github:member:issues:${username}:${repoName}:${githubUsername}:${todayDate}:since:${sinceDateStr}:${from}`;

    // Check cache first (unless caching is disabled)
    if (this.Caching === 'true') {
      const cachedResult = await getCachedData(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    const sinceDate = new Date(since);
    const [openIssues, closedIssues] = await Promise.all([
      axios.get(
        `${GITHUB_API_BASE}/search/issues?q=repo:${username}/${repoName}+author:${githubUsername}+type:issue+state:open+created:>=${sinceDateStr}`,
        { headers: this.headers }
      ),
      axios.get(
        `${GITHUB_API_BASE}/search/issues?q=repo:${username}/${repoName}+author:${githubUsername}+type:issue+state:closed+created:>=${sinceDateStr}`,
        { headers: this.headers }
      )
    ]);

    const result = {
      open: openIssues.data.total_count,
      closed: closedIssues.data.total_count,
      items: [...openIssues.data.items, ...closedIssues.data.items]
    };

    await setCachedData(cacheKey, result);
    return {
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        fromCache: false,
        sinceDate: since
      }
    };
  }

  async fetchMemberPullRequestsSince(username, repoName, githubUsername, since, from) {
    // Use a day-based cache key with the since date
    const todayDate = new Date().toISOString().split('T')[0];
    const sinceDateStr = new Date(since).toISOString().split('T')[0];
    const cacheKey = `github:member:prs:${username}:${repoName}:${githubUsername}:${todayDate}:since:${sinceDateStr}:${from}`;
    
    // Check cache first (unless caching is disabled)
    if (this.Caching === 'true') {
      const cachedResult = await getCachedData(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    const [openPRs, closedPRs] = await Promise.all([
      axios.get(
        `${GITHUB_API_BASE}/search/issues?q=repo:${username}/${repoName}+author:${githubUsername}+type:pr+state:open+created:>=${sinceDateStr}`,
        { headers: this.headers }
      ),
      axios.get(
        `${GITHUB_API_BASE}/search/issues?q=repo:${username}/${repoName}+author:${githubUsername}+type:pr+state:closed+created:>=${sinceDateStr}`,
        { headers: this.headers }
      )
    ]);

    const result = {
      open: openPRs.data.total_count,
      closed: closedPRs.data.total_count,
      merged: closedPRs.data.items.filter(item => 
        item.pull_request && item.pull_request.merged_at
      ).length,
      items: [...openPRs.data.items, ...closedPRs.data.items]
    };

    await setCachedData(cacheKey, result);
    return {
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        fromCache: false,
        sinceDate: since
      }
    };
  }
}

module.exports = GitHubService; 