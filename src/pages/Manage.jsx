import React, { useEffect , useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import supabase from "../lib/supabase";
import { 
  Github,
  ArrowLeft,
} from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import Contact from "../components/manage-team/Contact";
import Details from "../components/manage-team/Details";
import Overview from "../components/manage-team/Overview";

// Set document title
document.title = "Team Management | CoFoundry";

export default function Manage() {
  const navigate = useNavigate();
  const { ideaId } = useParams();
  // State Management
  const [session, setSession] = useState(null);
  const [idea, setIdea] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [repostats, setRepoStats] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [dailyCommitData, setDailyCommitData] = useState({ labels: [], datasets: [] });
  const [repo, setRepo] = useState([]);
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Main data fetching effect
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // 1. First ensure we have a valid session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/');
          return;
        }

        // 2. Check if GitHub token is missing or expired
        if (!session.provider_token) {
          toast.error('GitHub session expired. Please reconnect.');
          await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
              redirectTo: window.location.origin + window.location.pathname,
            }
          });
          return;
        }

        // 3. Store session in state
        setSession(session);

        // 4. Fetch team and idea data
        const [ideaResponse, teamResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/idea/${ideaId}`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          }),
          axios.get(`http://localhost:5000/api/manage-team/get-team/${ideaId}`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          })
        ]);

        // 5. Process idea data
        if (!ideaResponse.data.success) {
          throw new Error('Failed to fetch idea details');
        }
        setIdea(ideaResponse.data.data);

        // 6. Process team data
        if (!teamResponse.data.success) {
          throw new Error('Failed to fetch team data');
        }
        const teamData = teamResponse.data.data;
        setTeam(teamData);

        console.log(teamData);
        // 7. If there's a connected repository, fetch its stats
        if (teamData.repo_name) {
          await getRepoStats(session, teamData);
          await getMemberStats(session,teamData);
        }

        // 8. If this is a redirect from OAuth, fetch repositories
        if (window.location.hash.includes('access_token')) {
          await getRepo(session);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [ideaId, navigate]);

  const getRepoStats = async (currentSession, currentTeam) => {
    try {
      // 1. Validate session and required data
      if (!currentSession?.provider_token) {
        throw new Error('No valid GitHub token found');
      }

      const username = currentSession.user.user_metadata.user_name;
      if (!username) {
        throw new Error('GitHub username not found');
      }

      if (!currentTeam?.repo_name) {
        throw new Error('No repository selected');
      }

      // 2. Set up date range for commit history
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const since = lastWeek.toISOString();
      const until = today.toISOString();

      // 3. Fetch all data in parallel
      const [allCommitsResponse, issuesResponse, pullsResponse, weeklyCommitsResponse] = await Promise.all([
        fetchAllCommits(username, currentTeam.repo_name, currentSession.provider_token),
        axios.get(`https://api.github.com/repos/${username}/${currentTeam.repo_name}/issues?state=all`, {
          headers: {
            'Authorization': `Bearer ${currentSession.provider_token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }),
        axios.get(`https://api.github.com/repos/${username}/${currentTeam.repo_name}/pulls`, {
          headers: {
            'Authorization': `Bearer ${currentSession.provider_token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }),
        axios.get(`https://api.github.com/repos/${username}/${currentTeam.repo_name}/commits`, {
          headers: {
            'Authorization': `Bearer ${currentSession.provider_token}`,
            'Accept': 'application/vnd.github.v3+json'
          },
          params: { since, until }
        })
      ]);

      // 4. Process commit data for chart
      const dailyCommits = processCommitData(weeklyCommitsResponse.data, today);
      setDailyCommitData(dailyCommits);

      // 5. Update repository statistics
      setRepoStats({
        commitCount: allCommitsResponse.length,
        issueCount: issuesResponse.data.length,
        pullCount: pullsResponse.data.length
      });

    } catch (error) {
      console.error('Error fetching repository data:', error);
      toast.error(error.message || 'Failed to load repository statistics');
    }
  };

  const fetchAllCommits = async (username, repoName, token, perPage = 100) => {
    let page = 1;
    let allCommits = [];
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get(
        `https://api.github.com/repos/${username}/${repoName}/commits`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          },
          params: { per_page: perPage, page }
        }
      );

      const commits = response.data;
      allCommits.push(...commits);

      hasMore = commits.length === perPage;
      page++;
    }

    return allCommits;
  };

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

  const handleConnectRepo = async (repo) => {
    setIsConnecting(true);
    try {
      // 1. Update team data in the backend
      const response = await axios.put(
        `http://localhost:5000/api/manage-team/update-team/${ideaId}`,
        {
          repo_name: repo.name,
          repo_url: repo.html_url,
        },
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error('Failed to connect repository');
      }

      // 2. Update local state
      const updatedTeam = {
        ...team,
        repo_name: repo.name,
        repo_url: repo.html_url
      };
      setTeam(updatedTeam);
      // 3. Fetch repository statistics
      await getRepoStats(session, updatedTeam);
      
      toast.success('Repository connected successfully!');
    } catch (error) {
      console.error('Error connecting repository:', error);
      toast.error(error.message || 'Failed to connect repository');
    } finally {
      setIsConnecting(false);
      setShowRepoDropdown(false);
    }
  };

  // GitHub Repository Functions
  const getRepo = async (session) => {
    try {
      const token = session?.provider_token || (await supabase.auth.getSession()).data.session.provider_token;
      const response = await axios.get('https://api.github.com/user/repos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      setRepo(response.data);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      if (error.message.includes('401')) {
        toast.error('GitHub token expired. Please reconnect your GitHub account.');
      } else {
        toast.error('Failed to fetch GitHub repositories');
      }
    }
  };

  const fetchAllCommitsForMember = async (username, repoName, github_username, token, perPage = 100) => {
    let page = 1;
    let allCommits = [];
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await axios.get(
          `https://api.github.com/repos/${username}/${repoName}/commits`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.v3+json'
            },
            params: { 
              per_page: perPage, 
              page,
              author: github_username 
            }
          }
        );

        const commits = response.data;
        allCommits.push(...commits);

        hasMore = commits.length === perPage;
        page++;
      } catch (error) {
        console.error(`Error fetching commits for ${github_username} on page ${page}:`, error);
        break;
      }
    }

    return allCommits;
  };

  const getMemberStats = async (session, team) => {
    if (!team || !session) {
      console.error('Missing team or session data');
      return;
    }

    const username = session.user.user_metadata.user_name;
    const repoName = team.repo_name;

    if (!username || !repoName) {
      console.error('Missing username or repository name');
      return;
    }

    const memberProfiles = team.member_profiles;
    if (!memberProfiles || !Array.isArray(memberProfiles)) {
      console.error('No member profiles found or invalid data');
      return;
    }

    console.log('Starting to process member profiles:', memberProfiles);

    try {
      const updatedProfiles = await Promise.all(memberProfiles.map(async (member) => {
        try {
          const github_username = member.github_username;
          if (!github_username) {
            console.warn(`GitHub username not found for member: ${member.full_name}`);
            return member;
          }

          console.log(`Fetching stats for member: ${github_username}`);

          const [
            commits,
            open_pr_response,
            closed_pr_response,
            open_issues_response,
            closed_issues_response
          ] = await Promise.all([
            fetchAllCommitsForMember(username, repoName, github_username, session.provider_token),
            axios.get(`https://api.github.com/search/issues?q=repo:${username}/${repoName}+author:${github_username}+type:pr+state:open`),
            axios.get(`https://api.github.com/search/issues?q=repo:${username}/${repoName}+author:${github_username}+type:pr+state:closed`),
            axios.get(`https://api.github.com/search/issues?q=repo:${username}/${repoName}+author:${github_username}+type:issues+state:open`),
            axios.get(`https://api.github.com/search/issues?q=repo:${username}/${repoName}+author:${github_username}+type:issues+state:closed`)
          ], {
            headers: {
              'Authorization': `Bearer ${session.provider_token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });

          const merged_pr_count = closed_pr_response.data.items.filter(item => 
            item.pull_request && item.pull_request.merged_at
          ).length;

          const memberStats = {
            merged_prs: merged_pr_count,
            open_prs: open_pr_response.data.total_count,
            closed_prs: closed_pr_response.data.total_count,
            commits: commits.length,
            open_issues: open_issues_response.data.total_count,
            closed_issues: closed_issues_response.data.total_count,
            last_commit: commits[0]?.commit?.author?.date || null
          };

          console.log(`Stats fetched for ${github_username}:`, memberStats);

          return {
            ...member,
            stats: memberStats
          };
        } catch (memberError) {
          console.error(`Error fetching stats for ${member.github_username}:`, memberError);
          return member;
        }
      }));

      console.log('All member stats fetched:', updatedProfiles);

      // Update team state with new member stats
      setTeam(prevTeam => {
        const newTeam = {
          ...prevTeam,
          member_profiles: updatedProfiles
        };
        console.log('Updated team state:', newTeam);
        return newTeam;
      });


    } catch (error) {
      console.error('Error in getMemberStats:', error);
      toast.error('Failed to fetch member statistics');
    }
  };

  // Tab Content Rendering
  const renderTabContent = () => {
    switch (activeTab) {
      case 'contact': 
        return <Contact session={session} ideaId={ideaId} team={team} />
      case 'overview':
        return <Overview session={session} repostats={repostats} team={team} dailyCommitData={dailyCommitData}  />     
      case 'details':
        return <Details team={team}/>
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div>
          <button 
            onClick={() => navigate(`/details/${ideaId}`)}
            className="flex items-center text-muted-foreground hover:text-primary transition-colors w-fit mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Back to Idea</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
              <p className="text-muted-foreground">
                {idea?.title || 'your idea'}
              </p>
            </div>

            {!team.repo_name ? (
              <div className="relative">
                <button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center space-x-2"
                  onClick={() => {
                    if (repo.length === 0) {
                      getRepo(session);
                    }
                    setShowRepoDropdown(!showRepoDropdown);
                  }}
                >
                  <Github className="h-4 w-4" />
                  <span>Connect GitHub Repo</span>
                </button>

                {/* Dropdown Menu */}
                {showRepoDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-md shadow-lg z-50">
                    <div className="p-2 border-b border-border">
                      <input
                        type="text"
                        placeholder="Search repositories..."
                        className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        onChange={(e) => {
                          // Add search functionality if needed
                        }}
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                      {repo.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          <Github className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                          Loading repositories...
                        </div>
                      ) : (
                        repo.map((repository) => (
                          <button
                            key={repository.id}
                            className="w-full px-4 py-2 text-left hover:bg-muted/50 flex items-center justify-between group"
                            onClick={() => handleConnectRepo(repository)}
                          >
                            <div className="flex items-center space-x-2">
                              <Github className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{repository.name}</span>
                              {repository.isPrivate && (
                                <span className="text-xs bg-yellow-500/20 text-yellow-700 px-1.5 py-0.5 rounded-full">
                                  Private
                                </span>
                              )}
                            </div>
                            <span className="opacity-0 group-hover:opacity-100 text-primary text-sm">
                              Connect →
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <div className="absolute -inset-[1px] rounded-md bg-gradient-to-r from-primary via-purple-500 to-primary opacity-75 blur-[2px] group-hover:opacity-100 transition-all duration-300 animate-border-glow"></div>
                  <div className="relative flex items-center space-x-2 px-4 py-2 bg-background rounded-md border border-transparent">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <a 
                      href={team.repo_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-foreground text-sm hover:text-primary transition-colors"
                    >
                      {team.repo_name}
                    </a>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (team.updated_at) {
                      const lastUpdate = new Date(team.updated_at);
                      const daysSinceUpdate = Math.floor((new Date() - lastUpdate) / (1000 * 60 * 60 * 24));
                      
                      if (daysSinceUpdate < 5) {
                        toast.error(`You can only update the repository after 5 days. ${5 - daysSinceUpdate} days remaining.`);
                        return;
                      }
                    }
                    setShowRepoDropdown(!showRepoDropdown);
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center space-x-2"
                >
                  <Github className="h-4 w-4" />
                  <span>Change Repo</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex space-x-8">
            {['overview', 'details', 'contact'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-1 font-medium text-sm transition-colors ${
                  activeTab === tab 
                    ? 'border-b-2 border-primary text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>

      {/* Add global styles for custom scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgb(var(--primary) / 0.2);
          border-radius: 20px;
          border: 2px solid transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgb(var(--primary) / 0.3);
        }
        
        /* For Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgb(var(--primary) / 0.2) transparent;
        }
      `}</style>

      {/* Add global styles for animations */}
      <style jsx global>{`
        @keyframes border-glow {
          0% {
            background-position: 50% 0%;
            transform: rotate(0deg) scale(1);
          }
          25% {
            background-position: 100% 50%;
            transform: rotate(0.5deg)
          }
          50% {
            background-position: 50% 100%;
            transform: rotate(0deg) scale(1);
          }
          75% {
            background-position: 0% 50%;
            transform: rotate(-0.5deg)
          }
          100% {
            background-position: 50% 0%;
            transform: rotate(0deg) scale(1);
          }
        }

        .animate-border-glow {
          animation: border-glow 2s ease infinite;
          background-size: 250% 250%;
          transition: all 0.3s ease;
        }

        .group:hover .animate-border-glow {
          animation-duration: 10s;
          background-size: 200%  200%;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(var(--primary-rgb), 0.2);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--primary-rgb), 0.3);
        }

        .bg-gradient {
          background: linear-gradient(to right, 
            rgba(var(--primary-rgb), 0.8),
            rgba(147, 51, 234, 0.8),
            rgba(var(--primary-rgb), 0.8)
          );
          background-size: 200% 100%;
        }
      `}</style>
    </div>
  );
}
