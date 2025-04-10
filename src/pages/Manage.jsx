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
import Submit from "../components/manage-team/Submit";

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
        if (!localStorage.getItem('provider_token')) {
          //set delay of 2 seconds before signing out
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          navigate('/');
          toast('Session expired. Please reconnect.',{
            icon: '🔑',
          });
          return;
        }

        // 3. Store session in state
        setSession(session);

        // 4. Fetch team and idea data
        const [ideaResponse, teamResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/idea/${ideaId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('provider_token')}`
            }
          }),
          axios.get(`http://localhost:5000/api/manage-team/get-team/${ideaId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('provider_token')}`
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
      if (!localStorage.getItem('provider_token')) {
        throw new Error('No valid GitHub token found');
      }

      const username = currentSession.user.user_metadata.user_name;
      if (!username) {
        throw new Error('GitHub username not found');
      }

      if (!currentTeam?.repo_name) {
        throw new Error('No repository selected');
      }

      console.log("Fetching repo stats for:", {
        username,
        repo: currentTeam.repo_name
      });

      // Add timestamp parameter for the server to properly identify the request
      const timestamp = Date.now();
      const requestConfig = {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('provider_token')}`
        },
        params: {
          t: timestamp,
          cache: 'true' 
        }
      };

      // 2. Fetch repository statistics from our backend
      const response = await axios.get(
        `http://localhost:5000/api/github/repo-stats/${username}/${currentTeam.repo_name}/${currentTeam.updated_at}`,
        requestConfig
      );

      if (!response.data.success) {
        throw new Error('Failed to fetch repository statistics');
      }

      console.log("Repo stats received:", {
        commitCount: response.data.data.commitCount,
        issueCount: response.data.data.issueCount,
        pullCount: response.data.data.pullCount,
        isCached: response.data.data.isCached
      });

      // 3. Update state with the data
      setDailyCommitData(response.data.data.dailyCommits);
      setRepoStats({
        commitCount: response.data.data.commitCount,
        issueCount: response.data.data.issueCount,
        pullCount: response.data.data.pullCount,
        lastUpdated: response.data.data.lastUpdated,
        isCached: response.data.data.isCached || false
      });

    } catch (error) {
      console.error('Error fetching repository data:', error);
      toast.error(error.message || 'Failed to load repository statistics');
    }
  };

  const handleConnectRepo = async (repo) => {
    setIsConnecting(true);
    try {
      // 1. Update team data in the backend
      const updated_at = new Date();
      const response = await axios.put(
        `http://localhost:5000/api/manage-team/update-team/${ideaId}`,
        {
          repo_name: repo.name,
          repo_url: repo.html_url,
          updated_at: updated_at
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('provider_token')}`
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
        repo_url: repo.html_url,
        updated_at : updated_at

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
    }
  };

  // GitHub Repository Functions
  const getRepo = async (session) => {
    try {
      const token = localStorage.getItem('provider_token');
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

    console.log("Fetching member stats for:", {
      username,
      repo: repoName,
      memberCount: team.member_profiles?.length || 0
    });

    const memberProfiles = team.member_profiles;
    if (!memberProfiles || !Array.isArray(memberProfiles)) {
      console.error('No member profiles found or invalid data');
      return;
    }

    try {
      // Add timestamp parameter for the server to properly identify the request
      const timestamp = Date.now();
      const requestConfig = {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('provider_token')}`
        },
        params: {
          t: timestamp,
          updatedDate: team.updated_at,
          cache: 'true',
          from: 'manage'
        }
      };

      const updatedProfiles = await Promise.all(memberProfiles.map(async (member) => {
        try {
          const github_username = member.github_username;
          if (!github_username) {
            console.warn(`GitHub username not found for member: ${member.full_name}`);
            return member;
          }

          console.log(`Fetching stats for member: ${github_username}`);

          // Fetch member statistics
          const response = await axios.get(
            `http://localhost:5000/api/github/member-stats/${username}/${repoName}/${github_username}/${member.joined_at}`,
            requestConfig
          );

          if (!response.data.success) {
            throw new Error(`Failed to fetch stats for ${github_username}`);
          }

          console.log(`Stats for ${github_username}:`, {
            commits: response.data.data.commits,
            isCached: response.data.data.isCached
          });

          return {
            ...member,
            stats: {
              ...response.data.data,
              isCached: response.data.data.isCached || false
            }
          };
        } catch (memberError) {
          console.error(`Error fetching stats for ${member.github_username}:`, memberError);
          return member;
        }
      }));

      // Update team state with new member stats
      setTeam(prevTeam => ({
        ...prevTeam,
        member_profiles: updatedProfiles
      }));

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
        return <Overview session={session} repostats={repostats} team={team} dailyCommitData={dailyCommitData} />     
      case 'details':
        return <Details team={team} />
      case 'submit':
        return <Submit session={session} ideaId={ideaId} team={team} repostats={repostats} />
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
                  }}
                >
                  <Github className="h-4 w-4" />
                  <span>Connect GitHub Repo</span>
                </button>

                {/* Dropdown Menu */}
                {repo.length > 0 && (
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
                      {repo.map((repository) => (
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
                      ))}
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
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex space-x-8 justify-between">
            <div className="flex space-x-8">
              {['overview', 'details', 'contact', 'submit'].map((tab) => (
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
            <div className="flex pb-2 px-1 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors items-center space-x-3">
              {/* it should display 29th march like this
              add a check if updated_at is null then display "Not connected yet" */}
              {team.updated_at ? (
              <p>ESTD : {new Date(team.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p> ) : 
              <p>Not connected yet</p>}
            </div>
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
