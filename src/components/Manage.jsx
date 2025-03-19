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
  Clock
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import axios from "axios";

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
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [commitData, setCommitData] = useState([]);
  const [dailyCommitData, setDailyCommitData] = useState({ labels: [], datasets: [] });
  const [recentMembers, setRecentMembers] = useState([]);
  const [repo, setRepo] = useState([]);
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch all data in a single useEffect
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Get session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) {
          navigate('/');
          return;
        }
        setSession(currentSession);

        // Fetch idea details
        //no need in future
        const { data: ideaData, error: ideaError } = await supabase
          .from('ideas')
          .select('*')
          .eq('id', ideaId)
          .single();
          
        if (ideaError) throw ideaError;
        setIdea(ideaData);
        
        // Fetch team members
        //this needs improvement
        const { data: teamData, error: teamError } = await supabase
          .from('applications')
          .select(`
            id,
            status,
            created_at,
            profiles:user_id (
              id,
              full_name,
              avatar_url,
              title,
              skills,
              email
            )
          `)
          .eq('idea_id', ideaId)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false });
          
        if (teamError) throw teamError;
        setTeam(teamData);
        setRecentMembers(teamData.slice(0, 5));

        // Check if this is a redirect from OAuth
        if (window.location.hash.includes('access_token')) {
          await getRepo();
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load team data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
    generateDailyCommitData();
    generateMockCommitData();
  }, [ideaId, navigate]);

  // GitHub Repository Functions
  const getRepo = async () => {
    try {
      if (!session?.provider_token) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: {
            redirectTo: window.location.origin + window.location.pathname,
          }
        });

        if (error) throw error;
        return;
      }

      const response = await axios.get('https://api.github.com/user/repos', {
        headers: {
          Authorization: `Bearer ${session.provider_token}`
        }
      });

      const repositories = response.data.map(({ id, name, private: isPrivate, html_url }) => ({
        id,
        name,
        isPrivate,
        url: html_url
      }));

      setRepo(repositories);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      toast.error('Failed to fetch GitHub repositories');
    }
  };

  const handleConnectRepo = async (repo) => {
    setIsConnecting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated delay
      setSelectedRepo(repo);

      const response = await axios.put(`http://localhost:5000/api/manage-team/update-team/${ideaId}`, {
        repo_name: repo.name,
        repo_url: repo.url,
      }, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.data.success) {
        toast.success('Repository connected successfully!');
      } else {
        toast.error('Failed to connect repository');
      }

      const { error } = await supabase
        .from('ideas')
        .update({ github_repo: repo.name })
        .eq('id', ideaId);
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Error connecting repository:', error);
      toast.error('Failed to connect repository');
    } finally {
      setIsConnecting(false);
      setShowRepoDropdown(false);
    }
  };

  // Mock Data Generation Functions
  const generateMockCommitData = () => {
    const data = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 12; i++) {
      data.push({
        month: months[i],
        count: Math.floor(Math.random() * 5000) + 1000,
      });
    }
    
    setCommitData(data);
  };

  const generateDailyCommitData = () => {
    const labels = [];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      labels.push(formattedDate);
      data.push(Math.floor(Math.random() * 90) + 10);
    }
    
    setDailyCommitData({
      labels,
      datasets: [
        {
          label: 'Total Commits',
          data,
          backgroundColor: '#9AE65C',
          hoverBackgroundColor: '#8BD84D',
          borderRadius: 4,
          borderWidth: 0,
        }
      ]
    });
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
        You have {team.length} team members this month.
      </p>

      <div className="space-y-4 mt-6">
        {members.length > 0 ? (
          members.map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {member.profiles?.avatar_url ? (
                    <img 
                      src={member.profiles.avatar_url} 
                      alt={member.profiles.full_name} 
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{member.profiles?.full_name || 'Team Member'}</p>
                  <p className="text-xs text-muted-foreground">{member.profiles?.email || 'No email provided'}</p>
                </div>
              </div>
              <div className="text-sm font-medium text-primary">
                +{Math.floor(Math.random() * 2000) + 39}.00
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
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card 
                title="Team Members" 
                value={team.length} 
                description="Active contributors" 
                icon={<Users className="h-4 w-4 text-muted-foreground" />} 
              />
              <Card 
                title="Total Commits" 
                value={idea?.team_size - team.length || 0} 
                description="Commits till now" 
                icon={<UserPlus className="h-4 w-4 text-muted-foreground" />} 
              />
              <Card 
                title="Total Issues" 
                value={idea?.total_issues - team.length || 0} 
                description="Open and fixed issues" 
                icon={<Github className="h-4 w-4 text-muted-foreground" />} 
              />
              <Card 
                title="Total Pull Requests" 
                value="12" 
                description="Open and Closed PRs" 
                icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />} 
              />
            </div>
            
            {/* Charts and Recent Members - Side by Side */}
            <div className="grid gap-6 md:grid-cols-7">
              <div className="md:col-span-4 bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Commit History</h3>
                </div>
                <div className="h-80">
                  <Bar options={chartOptions} data={dailyCommitData} ref={chartRef} />
                </div>
              </div>
              
              <div className="md:col-span-3 bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
                <RecentMembersList members={recentMembers} />
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
    <div className="max-w-8xl mx-auto px-4">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
            <p className="text-muted-foreground">
              Manage your team for {idea?.title || 'your idea'}
            </p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => navigate(`/details/${ideaId}`)}
              className="bg-muted text-muted-foreground hover:bg-muted/80 px-4 py-2 rounded-md"
            >
              Back to Idea
            </button>
            
            {!selectedRepo ? (
              <div className="relative">
                <button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center space-x-2"
                  onClick={() => {
                    if (repo.length === 0) {
                      getRepo();
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
                <div className="bg-card border border-border px-4 py-2 rounded-md flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-muted-foreground">{selectedRepo.name}</span>
                </div>
                <a 
                  href={selectedRepo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center space-x-2"
                >
                  <Github className="h-4 w-4" />
                  <span>View Repo</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex space-x-8">
            {['overview', 'details', 'tasks'].map((tab) => (
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
    </div>
  );
}
