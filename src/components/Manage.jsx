import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import supabase from "../lib/supabase";
import { 
  Users, 
  DollarSign, 
  CreditCard, 
  Activity,
  Settings,
  Github,
  UserPlus,
  MessageSquare,
  BarChart,
  Calendar,
  GitCommit,
  User,
  AlertTriangle,
  UserX,
  Mail,
  CheckCircle2,
  Clock,
  ArrowLeft,
  MessageCircle,
  Slack,
  Info
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import axios from "axios";
import Contact from "./manage-team/Contact";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Set document title
document.title = "Team Management | CoFoundry";

export default function Manage() {
  const navigate = useNavigate();
  const { ideaId } = useParams();
  const chartRef = useRef(null);

  // State Management
  const [session, setSession] = useState(null);
  const [idea, setIdea] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [repostats, setRepoStats] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [commitData, setCommitData] = useState([]);
  const [dailyCommitData, setDailyCommitData] = useState({ labels: [], datasets: [] });
  const [recentMembers, setRecentMembers] = useState([]);
  const [repo, setRepo] = useState([]);
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
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

        // 2. Check if we need to refresh GitHub token
        if (!session.provider_token) {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
              redirectTo: window.location.origin + window.location.pathname,
            }
          });
          if (error) throw error;
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
        setSelectedRepo(teamData);

        console.log(teamData);
        // 7. If there's a connected repository, fetch its stats
        if (teamData.repo_name) {
          await getRepoStats(session, teamData);
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
      setSelectedRepo(updatedTeam);

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

  const generateDetailsMockData = () => {
    // Sample data for demonstration
    const mockTeamMembers = [
      {
        id: 1,
        profiles: {
          full_name: "Sarah Chen",
          email: "sarah.chen@example.com",
          title: "Frontend Developer",
          avatar_url: "https://ui-avatars.com/api/?name=Sarah+Chen&background=random",
          skills: ["React", "TypeScript", "Tailwind CSS"]
        },
        stats: {
          totalCommits: 342,
          lastCommit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          pullRequests: 28,
          codeReviews: 45
        },
        joined_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
      },
      {
        id: 2,
        profiles: {
          full_name: "James Wilson",
          email: "james.wilson@example.com",
          title: "Backend Developer",
          avatar_url: "https://ui-avatars.com/api/?name=James+Wilson&background=random",
          skills: ["Node.js", "Python", "PostgreSQL"]
        },
        stats: {
          totalCommits: 289,
          lastCommit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          pullRequests: 23,
          codeReviews: 31
        },
        joined_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) // 45 days ago
      },
      {
        id: 3,
        profiles: {
          full_name: "Emily Rodriguez",
          email: "emily.r@example.com",
          title: "Full Stack Developer",
          avatar_url: "https://ui-avatars.com/api/?name=Emily+Rodriguez&background=random",
          skills: ["React", "Node.js", "MongoDB"]
        },
        stats: {
          totalCommits: 421,
          lastCommit: new Date(), // today
          pullRequests: 35,
          codeReviews: 52
        },
        joined_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      },
      {
        id: 4,
        profiles: {
          full_name: "Michael Park",
          email: "michael.park@example.com",
          title: "DevOps Engineer",
          avatar_url: "https://ui-avatars.com/api/?name=Michael+Park&background=random",
          skills: ["Docker", "Kubernetes", "AWS"]
        },
        stats: {
          totalCommits: 156,
          lastCommit: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
          pullRequests: 15,
          codeReviews: 27
        },
        joined_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
      },
      {
        id: 5,
        profiles: {
          full_name: "Lisa Thompson",
          email: "lisa.t@example.com",
          title: "UI/UX Designer",
          avatar_url: "https://ui-avatars.com/api/?name=Lisa+Thompson&background=random",
          skills: ["Figma", "Adobe XD", "Prototyping"]
        },
        stats: {
          totalCommits: 89,
          lastCommit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          pullRequests: 12,
          codeReviews: 18
        },
        joined_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      }
    ];

    return mockTeamMembers;
  };

  // UI Components
  const Card = ({ title, value, description, icon }) => (
    <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );

  const RecentMembersList = ({ members }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Team Members</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Showing {Math.min(5, members.length)} of {members.length} team members.
      </p>

      <div className="space-y-4 mt-6">
        {members.length > 0 ? (
          members.slice(0, 5).map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {member.avatar_url ? (
                    <img 
                      src={member.avatar_url} 
                      alt={member.full_name} 
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{member.full_name || 'Team Member'}</p>
                  <p className="text-xs text-muted-foreground">{member.email || 'No email provided'}</p>
                </div>
              </div>
              <div className="text-sm font-medium text-primary">
                {new Date(member.joined_at).toLocaleDateString('en-US', { 
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No team members yet.</p>
        )}
      </div>
    </div>
  );

  // Chart Configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgb(156, 163, 175)', // text-muted-foreground equivalent
          font: {
            size: 12,
            weight: 'medium'
          },
          boxWidth: 15,
          padding: 15
        }
      },
      title: {
        display: false,
        text: 'Daily Commits (Last 7 Days)',
        color: 'rgb(17, 24, 39)', // text-foreground equivalent
        font: {
          size: 18,
          weight: 'bold',
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgb(31, 41, 55)', // bg-card equivalent
        titleColor: 'rgb(243, 244, 246)', // text-card-foreground equivalent
        bodyColor: 'rgb(243, 244, 246)', // text-card-foreground equivalent
        borderColor: 'rgb(75, 85, 99)', // border-border equivalent
        borderWidth: 1,
        padding: 8,
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `Total Commits: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)', // text-muted-foreground with opacity
        },
        ticks: {
          color: 'rgb(156, 163, 175)', // text-muted-foreground equivalent
          font: {
            size: 12,
          },
          padding: 2
        },
        title: {
          display: true,
          color: 'rgb(156, 163, 175)', // text-muted-foreground equivalent
          font: {
            size: 13,
            weight: 'medium'
          },
          padding: {
            bottom: 10
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgb(156, 163, 175)', // text-muted-foreground equivalent
          font: {
            size: 12,
          },
          padding: 8
        }
      }
    },
    barThickness: 50,
    maxBarThickness: 100,
    barPercentage: 0.8,
    categoryPercentage: 0.8
  };

  // Tab Content Rendering
  const renderTabContent = () => {
    switch (activeTab) {
      case 'contact': 
        return <Contact session={session} ideaId={ideaId} team={team} />
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card 
                title="Team Members" 
                value={team.member_profiles.length} 
                description="Active contributors" 
                icon={<Users className="h-4 w-4 text-muted-foreground" />} 
              />
              {!selectedRepo.repo_name ? (
                <>
                  <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm flex flex-col items-center justify-center">
                    <Github className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">Connect a repository to view commit statistics</p>
                  </div>
                  <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm flex flex-col items-center justify-center">
                    <Github className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">Connect a repository to view issue statistics</p>
                  </div>
                  <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm flex flex-col items-center justify-center">
                    <Github className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">Connect a repository to view PR statistics</p>
                  </div>
                </>
              ) : (
                <>
                  <Card 
                    title="Total Commits" 
                    value={repostats?.commitCount || 0} 
                    description="Commits till now" 
                    icon={<UserPlus className="h-4 w-4 text-muted-foreground" />} 
                  />
                  <Card 
                    title="Total Issues" 
                    value={repostats?.issueCount || 0} 
                    description="Open and fixed issues" 
                    icon={<Github className="h-4 w-4 text-muted-foreground" />} 
                  />
                  <Card 
                    title="Total Pull Requests" 
                    value={repostats?.pullCount || 0} 
                    description="Open and Closed PRs" 
                    icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />} 
                  />
                </>
              )}
            </div>
            
            {/* Charts and Recent Members - Side by Side */}
            <div className="grid gap-6 md:grid-cols-7">
              <div className="md:col-span-4 bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Commit History</h3>
                </div>
                {!selectedRepo.repo_name ? (
                  <div className="h-80 flex flex-col items-center justify-center">
                    <Github className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg text-muted-foreground text-center mb-2">No Repository Connected</p>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      Connect a GitHub repository to view commit history and other statistics
                    </p>
                  </div>
                ) : (
                  <div className="h-80">
                    <Bar options={chartOptions} data={dailyCommitData} ref={chartRef} />
                  </div>
                )}
              </div>
              
              <div className="md:col-span-3 bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
                <RecentMembersList members={team.member_profiles} />
              </div>
            </div>
          </div>
        );
      
      case 'details':
        const mockTeamData = generateDetailsMockData();
        
        return (
          <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Team Members</h2>
              <div className="text-sm text-muted-foreground">
                Total Members: {mockTeamData.length}
              </div>
            </div>

            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Member</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium text-center">Commits</th>
                    <th className="px-4 py-3 font-medium text-center">PRs</th>
                    <th className="px-4 py-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockTeamData.map((member) => (
                    <tr key={member.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <img 
                              src={member.profiles.avatar_url}
                              alt={member.profiles.full_name}
                              className="h-8 w-8 rounded-full"
                            />
                          </div>
                          <div>
                            <button 
                              onClick={() => navigate(`/profile/${member.profiles.id}`)}
                              className="font-medium hover:text-muted-foreground transition-colors"
                            >
                              {member.profiles.full_name}
                            </button>
                            <div className="text-xs text-muted-foreground">{member.profiles.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(member.joined_at).toLocaleDateString('en-US', { 
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-medium">{member.stats.totalCommits}</span>
                          <span className="text-xs text-muted-foreground">
                            Last: {member.stats.lastCommit.toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-medium">{member.stats.pullRequests}</span>
                          <span className="text-xs text-muted-foreground">
                            {member.stats.codeReviews} reviews
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => toast.error(`Warning sent to ${member.profiles.full_name}`)}
                            className="text-amber-500 hover:text-amber-600 transition-colors"
                            title="Send Warning"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => toast.success(`Removed ${member.profiles.full_name} from team`)}
                            className="text-destructive hover:text-destructive/80 transition-colors"
                            title="Remove Member"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'tasks':
        return (
          <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Team Tasks</h2>
            <div className="space-y-4">
              <div className="p-4 border border-border rounded-md bg-muted/50">
                <h3 className="font-medium">Publish a new task</h3>
                <textarea 
                  className="w-full mt-2 p-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Describe the task here..."
                  rows={3}
                />
                <div className="mt-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Select Tag:</label>
                  <div className="flex space-x-2">
                    {['Major Task', 'Minor Task', 'Bug Fixes', 'Improvements', 'Optimization'].map((tag) => (
                      <button
                        key={tag}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        onClick={() => console.log(`Selected tag: ${tag}`)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm">
                    Publish Task
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Recent Tasks</h3>
                <div className="p-3 border-l-4 border-primary bg-muted/50 rounded-r-md">
                  <p className="text-sm">Implement new authentication system.</p>
                  <p className="text-xs text-muted-foreground mt-1">Assigned 2 days ago</p>
                  <span className="inline-block bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">Major Task</span>
                </div>
                <div className="p-3 border-l-4 border-muted-foreground bg-muted/50 rounded-r-md">
                  <p className="text-sm">Design new dashboard layout.</p>
                  <p className="text-xs text-muted-foreground mt-1">Assigned 5 days ago</p>
                  <span className="inline-block bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">Improvements</span>
                </div>
              </div>
            </div>
          </div>
        );
      
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

            {!selectedRepo.repo_name ? (
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
                      href={selectedRepo.repo_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-foreground text-sm hover:text-primary transition-colors"
                    >
                      {selectedRepo.repo_name}
                    </a>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (selectedRepo.updated_at) {
                      const lastUpdate = new Date(selectedRepo.updated_at);
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
            {['overview', 'details', 'tasks', 'contact'].map((tab) => (
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
