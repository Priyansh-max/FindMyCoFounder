import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { Users, Phone, XCircle, Clock, CheckCircle, Undo, X, Lightbulb, Heart, ScrollText, Github, PlayCircle, Calendar, Info, GitPullRequest, AlertTriangle, ExternalLink, FileCode, CheckCircle2, Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { RiDeleteBin6Line } from "react-icons/ri";
import { AiOutlineStop } from "react-icons/ai";
import { GrView } from "react-icons/gr";
import { Tooltip } from "react-tooltip";
import CircularProgress from '@/components/ui/CircularProgress';
import { IoDocumentTextOutline } from "react-icons/io5";
import { GoLink } from "react-icons/go";
import EditProfile from '@/props/EditProfile';
import ErrorPage from '../components/ErrorPage';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { cn } from "@/lib/utils";
import ProjectStats from '@/components/ui/ProjectStats';
import Authored from '../components/profile/Authored';
import PostedTab from '../components/profile/PostedTab';
import ApplicationTab from '../components/profile/ApplicationTab';
import ContributedTab from '../components/profile/ContributedTab';

function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [EditprofileOverlay, setEditprofileOverlay] = useState(false);
  const [stats, setStats] = useState({
    applications_sent: {
      total: 0,
      accepted: 0,
      pending: 0,
      rejected: 0
    },
    applications_received: {
      total: 0,
      accepted: 0,
      pending: 0,
      rejected: 0
    },
    ideas_posted: 0
  });
  const [projectStats, setProjectStats] = useState({
    ratings: [],
    totalCommits: 0,
    totalIssues: 0,
    totalPRs: 0,
    mergedPRs: 0
  });
  const [activeTab, setActiveTab] = useState('applications');
  const [authoredProjects, setAuthoredProjects] = useState([]);
  const [contributedProjects, setContributedProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const resetError = () => {
    setError(null);
    checkUser();
  };

  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    checkUser();
  }, []);

  function handleOverlay(){
    setEditprofileOverlay(true);
  }

  async function checkUser() {
    setLoading(true);
    console.log(apiUrl);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        setLoading(false);
        return;
      }

      setUser(session.user);
      setSession(session);
      
      // Create an array of promises for parallel fetching
      const fetchPromises = [
        fetchProfile(session),
        fetchApplications(session),
        fetchIdeas(session),
        fetchStats(session),
        fetchProjectStats(session)
      ];

      // Wait for all fetch operations to complete
      await Promise.all(fetchPromises);
    } catch (error) {
      console.error('Error:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats(session) {
    try {
      const response = await axios.get(`${apiUrl}/api/data/stats`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.data.success) {
        setStats(response.data.data);
        console.log('Fetched stats:', response.data.data);
      } else {
        throw new Error('Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch statistics');
    }
  }

  async function fetchProfile(session) {
    try {
      const response = await axios.get(`${apiUrl}/api/profile/details`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.data.success) {
        setProfile(response.data.data);
        console.log('Profile Response:', response.data);
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  }

  async function fetchApplications(session) {
    try {
      const response = await axios.get(`${apiUrl}/api/application/user`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const { data, error } = response.data;
      
      if (error) {
        throw new Error(error);
      }

      setApplications(data || []);
      console.log('Fetched applications:', data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch applications');
    }
  }
  
  async function fetchIdeas(session) {
    try {
      const response = await axios.get(`${apiUrl}/api/idea/user`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const { success, data } = response.data;
      
      if (success) {
        setIdeas(data || []);
        console.log('Fetched ideas:', data);
      } else {
        throw new Error('Failed to fetch ideas');
      }
    } catch (error) {
      console.error('Error fetching ideas:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch ideas');
    }
  }

  const filteredApplications = filter === "all"
  ? applications
  : applications.filter((app) => app.status === filter);

  async function fetchProjectStats(session) {
    try {
      const response = await axios.get(`${apiUrl}/api/profile/get-project-stats`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.data.success) {
        setProjectStats(response.data.data);
        console.log('Fetched project stats:', response.data.data);
        
        // Extract project IDs from project completion data
        const authoredIds = response.data.data.ratings
          .filter(project => project.role === 'author')
          .map(project => project.project_id);
          
        const contributedIds = response.data.data.ratings
          .filter(project => project.role === 'contributor')
          .map(project => project.project_id);
          
        console.log(authoredIds);
        console.log(contributedIds);
        // Fetch details for these projects if tab is active or there are projects
        if (activeTab === 'authored' && authoredIds.length > 0) {
          fetchProjectDetails(session, authoredIds, 'authored');
        }
        
        if (activeTab === 'contributed' && contributedIds.length > 0) {
          fetchProjectDetails(session, contributedIds, 'contributed');
        }
      } else {
        throw new Error('Failed to fetch project statistics');
      }
    } catch (error) {
      console.error('Error fetching project stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch project statistics');
    }
  }
  
  // Function to fetch project details
  async function fetchProjectDetails(session, projectIds, type) {
    if (!projectIds || projectIds.length === 0) return;
    
    setLoadingProjects(true);
    try {
      const response = await axios.get(`${apiUrl}/api/profile/get-project-details?projectIds=${projectIds.join(',')}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.data.success) {
        if (type === 'authored') {
          setAuthoredProjects(response.data.data);
        } else {
          setContributedProjects(response.data.data);
        }
        console.log(`Fetched ${type} project details:`, response.data.data);
      } else {
        throw new Error(`Failed to fetch ${type} project details`);
      }
    } catch (error) {
      console.error(`Error fetching ${type} project details:`, error);
      toast.error(`Failed to fetch ${type} project details`);
    } finally {
      setLoadingProjects(false);
    }
  }

  // Load project details when tab changes
  useEffect(() => {
    const loadProjectDetails = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        if (activeTab === 'authored' && projectStats.ratings.length > 0) {
          const authoredIds = projectStats.ratings
            .filter(project => project.role === 'author')
            .map(project => project.project_id);
            
          if (authoredIds.length > 0 && authoredProjects.length === 0) {
            fetchProjectDetails(session, authoredIds, 'authored');
          }
        }
        
        if (activeTab === 'contributed' && projectStats.ratings.length > 0) {
          const contributedIds = projectStats.ratings
            .filter(project => project.role === 'contributor')
            .map(project => project.project_id);
            
          if (contributedIds.length > 0 && contributedProjects.length === 0) {
            fetchProjectDetails(session, contributedIds, 'contributed');
          }
        }
      } catch (error) {
        console.error('Error loading project details:', error);
      }
    };
    
    loadProjectDetails();
  }, [activeTab, projectStats.ratings]);

  if (error) {
    return <ErrorPage error={error} resetError={resetError} />;
  }

  if (loading || !profile) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        <div className='w-full lg:w-1/3 flex flex-col h-fit lg:sticky lg:top-8'>
          <div className="bg-card text-card-foreground p-4 sm:p-6 rounded-lg shadow-md dark:shadow-primary/10 border border-border">
            {/* Profile Header */}
            <div className='flex justify-content'>
              <div className='mr-3 sm:mr-4'>
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-16 sm:w-20 h-16 sm:h-20 rounded-md object-cover"
                />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold mb-1 text-foreground">{profile.full_name}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>
            <div className='pt-2'>
              <p className='text-xs sm:text-sm text-muted-foreground'>{profile.description}</p>
            </div>

            {/* Skills Section */}
            {profile.skills && (
              <div className="mt-3 sm:mt-4">
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {profile.skills.split(',').map((skill, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs bg-primary/10 text-primary"
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Edit Profile Button */}
            <button 
              className="w-full mt-3 sm:mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 rounded-md transition-colors text-sm"
              onClick={handleOverlay}
            >
              Edit Profile
            </button>

            {/* Location & Github */}
            <div className="mt-3 sm:mt-4 space-y-2 text-muted-foreground">
              {profile.github_url && (
                <div className='flex'>
                  <a 
                    href={profile.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 hover:text-primary transition-colors text-xs sm:text-sm"
                  >
                    <Github className="w-4 h-4" />
                    <span>{new URL(profile.github_url).pathname.substring(1)}</span>
                  </a>
                </div>
              )}
              {profile.portfolio_url && (
                <div className='flex'>
                  <a 
                    href={profile.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 hover:text-primary transition-colors text-xs sm:text-sm"
                  >
                    <GoLink className="w-4 h-4" />
                    <span>{new URL(profile.portfolio_url).hostname}</span>
                  </a>
                </div>
              )}
              {profile.resume_url && (
                <div className='flex'>
                  <a 
                    href={profile.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 hover:text-primary transition-colors text-xs sm:text-sm"
                  >
                    <IoDocumentTextOutline className="w-4 h-4" />
                    <span>Resume</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="h-4 sm:h-6"></div>

          {/* Numbers */}
          <div className='bg-card text-card-foreground flex flex-col shadow-md dark:shadow-primary/10 p-3 sm:p-4 md:p-6 rounded-xl border border-border'>
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center text-foreground">
              <ScrollText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" />
              Overview
            </h2>

            {/* Applications Sent Section */}
            <div className='flex flex-col items-center'>
              <div className="relative group">
                <CircularProgress
                  total={stats.applications_sent.total}
                  accepted={stats.applications_sent.accepted}
                  pending={stats.applications_sent.pending}
                  rejected={stats.applications_sent.rejected}
                  content="Applications Sent"
                />
                {/* Hover Stats */}
                <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="absolute top-1/4 left-full ml-2">
                    <div className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-100 px-2 py-1 rounded text-sm whitespace-nowrap">
                      Accepted: {stats.applications_sent.accepted}
                    </div>
                  </div>
                  <div className="absolute top-1/2 left-full ml-2 -translate-y-1/2">
                    <div className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-100 px-2 py-1 rounded text-sm whitespace-nowrap">
                      Pending: {stats.applications_sent.pending}
                    </div>
                  </div>
                  <div className="absolute bottom-1/4 left-full ml-2">
                    <div className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-100 px-2 py-1 rounded text-sm whitespace-nowrap">
                      Rejected: {stats.applications_sent.rejected}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-border my-4"></div>

            {/* Application Received Section */}
            <div className='flex flex-col items-center'>
              <div className="relative group">
                <CircularProgress
                  total={stats.applications_received.total}
                  accepted={stats.applications_received.accepted}
                  pending={stats.applications_received.pending}
                  rejected={stats.applications_received.rejected}
                  content="Applications Received"
                />
                {/* Hover Stats */}
                <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="absolute top-1/4 left-full ml-2">
                    <div className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-100 px-2 py-1 rounded text-sm whitespace-nowrap">
                      Accepted: {stats.applications_received.accepted}
                    </div>
                  </div>
                  <div className="absolute top-1/2 left-full ml-2 -translate-y-1/2">
                    <div className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-100 px-2 py-1 rounded text-sm whitespace-nowrap">
                      Pending: {stats.applications_received.pending}
                    </div>
                  </div>
                  <div className="absolute bottom-1/4 left-full ml-2">
                    <div className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-100 px-2 py-1 rounded text-sm whitespace-nowrap">
                      Rejected: {stats.applications_received.rejected}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-border my-4"></div>

            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#1e293b] rounded-lg p-3 flex flex-col items-center">
                <div className="flex items-center justify-center gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Ideas</span>
                </div>
                <span className="text-xl font-bold text-white mt-1">{stats.ideas_posted}</span>
              </div>

              <div className="bg-[#1e293b] rounded-lg p-3 flex flex-col items-center">
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Contacts</span>
                </div>
                <span className="text-xl font-bold text-white mt-1">{stats.applications_sent.pending}</span>
              </div>

              <div className="bg-[#1e293b] rounded-lg p-3 flex flex-col items-center">
                <div className="flex items-center justify-center gap-2">
                  <Heart className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Likes</span>
                </div>
                <span className="text-xl font-bold text-white mt-1">{stats.applications_received.rejected}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Content */}
        <div className="w-full lg:w-4/5 space-y-4 sm:space-y-6 lg:space-y-8 overflow-hidden">
          {/* Project Stats at Top */}
          <ProjectStats stats={projectStats} />

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-card text-card-foreground p-2.5 sm:p-3 rounded-lg border border-border shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <div className="p-1 sm:p-1.5 bg-primary/10 rounded-full">
                  <GitPullRequest className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                </div>
                <h3 className="text-xs sm:text-sm font-medium">Total Commits</h3>
              </div>
              <p className="text-lg sm:text-xl font-bold text-foreground">{projectStats.totalCommits || 0}</p>
            </div>

            <div className="bg-card text-card-foreground p-2.5 sm:p-3 rounded-lg border border-border shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <div className="p-1 sm:p-1.5 bg-yellow-500/10 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />
                </div>
                <h3 className="text-xs sm:text-sm font-medium">Total Issues</h3>
              </div>
              <p className="text-lg sm:text-xl font-bold text-foreground">{projectStats.totalIssues || 0}</p>
            </div>

            <div className="bg-card text-card-foreground p-2.5 sm:p-3 rounded-lg border border-border shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <div className="p-1 sm:p-1.5 bg-blue-500/10 rounded-full">
                  <GitPullRequest className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                </div>
                <h3 className="text-xs sm:text-sm font-medium">Total PRs</h3>
              </div>
              <p className="text-lg sm:text-xl font-bold text-foreground">{projectStats.totalPRs || 0}</p>
            </div>

            <div className="bg-card text-card-foreground p-2.5 sm:p-3 rounded-lg border border-border shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <div className="p-1 sm:p-1.5 bg-green-500/10 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                </div>
                <h3 className="text-xs sm:text-sm font-medium">Merged PRs</h3>
              </div>
              <p className="text-lg sm:text-xl font-bold text-foreground">{projectStats.mergedPRs || 0}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3 mb-2">
            <button
              onClick={() => setActiveTab('applications')}
              className={cn(
                "px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 border",
                activeTab === 'applications'
                  ? "bg-primary/10 border-primary text-primary shadow-sm"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <ScrollText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Your Applications
              </div>
            </button>
            <button
              onClick={() => setActiveTab('posted')}
              className={cn(
                "px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 border",
                activeTab === 'posted'
                  ? "bg-primary/10 border-primary text-primary shadow-sm"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Your Ideas
              </div>
            </button>
            <button
              onClick={() => setActiveTab('authored')}
              className={cn(
                "px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 border",
                activeTab === 'authored'
                  ? "bg-primary/10 border-primary text-primary shadow-sm"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <FileCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Authored
              </div>
            </button>
            <button
              onClick={() => setActiveTab('contributed')}
              className={cn(
                "px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 border",
                activeTab === 'contributed'
                  ? "bg-primary/10 border-primary text-primary shadow-sm"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <GitPullRequest className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Contributed
              </div>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'applications' && (
            <div className="bg-card text-card-foreground p-3 sm:p-4 md:p-6 rounded-xl shadow-md dark:shadow-primary/10 border border-border">
              <div className="flex items-center justify-between">
                <h2 className="mb-4 text-lg sm:text-xl font-bold text-foreground">Your Applications</h2>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="mb-4 border border-border rounded-md p-2 text-sm transition-all duration-200 
                  focus:outline-none focus:ring-2 focus:ring-primary 
                  hover:shadow-md cursor-pointer bg-background text-foreground"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Applications List */}
              <ApplicationTab filteredApplications={filteredApplications} />
            </div>
          )}

          {activeTab === 'posted' && (
            <div className="bg-card text-card-foreground p-3 sm:p-4 md:p-6 rounded-xl shadow-md dark:shadow-primary/10 border border-border">
              <h2 className="text-lg sm:text-xl font-bold mb-4 text-foreground">Your Posted Ideas</h2>
              <PostedTab ideas={ideas} session={session}/>
              {ideas.length === 0 && (
                <div className="text-center p-6">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-foreground mb-2">No ideas posted yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  You haven't created any ideas yet. Start by posting an idea.
                </p>
              </div>
              )}
            </div>
          )}

          {activeTab === 'authored' && (
            <div className="bg-card text-card-foreground p-3 sm:p-4 md:p-6 rounded-xl shadow-md dark:shadow-primary/10 border border-border">
              <h2 className="text-lg sm:text-xl font-bold mb-4 text-foreground">Projects You Created</h2>
              {loadingProjects ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : projectStats.ratings.filter(project => project.role === 'author').length > 0 ? (
                <Authored authoredProjects={authoredProjects} />
              ) : (
                <div className="text-center p-10">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-medium text-foreground mb-2">No projects found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    You haven't created any projects yet. Start by posting an idea and completing it to see your authored projects here.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'contributed' && (
            <div className="bg-card text-card-foreground p-3 sm:p-4 md:p-6 rounded-xl shadow-md dark:shadow-primary/10 border border-border">
              <h2 className="text-lg sm:text-xl font-bold mb-4 text-foreground">Projects You Contributed To</h2>
              {loadingProjects ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : projectStats.ratings.filter(project => project.role === 'contributor').length > 0 ? (
                <ContributedTab contributedProjects={contributedProjects} />
              ) : (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <div className="flex flex-col items-center justify-center">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium text-foreground mb-1">No Contributions Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Apply to projects and start contributing to see them here!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* edit profile overlay */}

      {EditprofileOverlay && (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[1000] p-10">
        <div
          className="bg-card text-card-foreground my-20 p-6 rounded-lg shadow-lg dark:shadow-primary/10 w-[650px] max-h-[90vh] relative overflow-y-auto modern-scrollbar border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setEditprofileOverlay(false)}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            ✖
          </button>
          <EditProfile />
        </div>
      </div>
      )}
      
    </div>


  );
  
}

export default Profile;