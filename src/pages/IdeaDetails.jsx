import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase'; // Ensure you import your Supabase instance
import { Users, Phone, ClipboardList, XCircle, Clock, CheckCircle, Undo, X,ArrowRight, Check } from "lucide-react";
import CircularProgress from '@/components/ui/CircularProgress';
import EditIdea from '../props/EditIdea';
import ErrorPage from '../components/ErrorPage';
import axios from 'axios';
import { cn } from '@/lib/utils';
import Initializing from '../props/Initializing'; // Import the Initializing component
import { toast } from 'react-hot-toast';

const IdeaDetails = () => {
  const { id } = useParams(); // Extracts idea ID from URL
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [teamCreation, setTeamCreation] = useState(false);
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [editIdeaOverlay, setEditIdeaOverlay] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showInitializing, setShowInitializing] = useState(false);
  const [authSession, setAuthSession] = useState(null); // Store auth session
  const [stats, setStats] = useState({
    applications_received: {
      total: 0,
      accepted: 0,
      pending: 0,
      rejected: 0
    }
  });

  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  useEffect(() => {
    fetchSession();
  }, [id]); // Runs when `id` changes

  const resetError = () => {
    setError(null);
    fetchSession();
  };

  async function fetchSession(){
    try{
      setLoading(true);
      // Get session only once
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        setLoading(false);
        return;
      }
      
      // Store session in state
      setAuthSession(session);

      // Use the same session for all API calls
      await Promise.all([
        fetchApplicationsForIdea(session),
        fetchIdeaDetails(session),
        fetchApplicationStats(session),
        checkTeamCreation(session)
      ]);
    } catch (error) {
      console.error('Error:', error);
      setError(error);
    } finally {
      // Small delay to ensure state updates have propagated
      setTimeout(() => {
        setLoading(false);
      }, 100);
    }
  }

  function handleOverlayEditIdea(){
    setEditIdeaOverlay(true);
  }

  async function handleOverlayViewMyTeam(){
    if(teamCreation){
      navigate(`/manage-team/${id}`);
    } else {
      // Show initializing animation
      setShowInitializing(true);
      
      try {
        // Use stored session instead of fetching a new one
        if (!authSession) {
          throw new Error('Authentication session not available');
        }
        
        // Call backend to create team
        const response = await axios.post(
          `${apiUrl}/api/manage-team/create-team/${id}`, 
          {}, 
          {
            headers: {
              'Authorization': `Bearer ${authSession.access_token}`
            }
          }
        );
        
        if (response.data.success) {
          // Team creation was successful, update state
          setTeamCreation(true);
          
          // The initializing component will navigate to the manage-team page when animation completes
        } else {
          throw new Error('Failed to create team');
        }
      } catch (error) {
        console.error('Error creating team:', error);
        setShowInitializing(false); // Hide initializing on error
        // Show error to user
        toast.error('Failed to create team. Please try again.');
      }
    }
  }

  const checkTeamCreation = async (session) => {
    try{
      const response = await axios.get(`${apiUrl}/api/manage-team/check-team/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if(response.data.success === true){
        setTeamCreation(true);
      }
    } catch (error) {
      console.error('Error checking team creation:', error);
      throw new Error('Error checking team creation');
    }
  }

  const fetchApplicationStats = async (session) => {
    try {
      const response = await axios.get(`${apiUrl}/api/data/application-stats/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.data.success) {
        setStats(response.data.data);
      } else {
        throw new Error('Failed to fetch application stats');
      }

    } catch (error) {
      console.error('Error fetching application stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch statistics');
    }
  };

  const fetchApplicationsForIdea = async (session) => {
    try {
      const response = await axios.get(`${apiUrl}/api/application/details/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.data.success) {
        setApplications(response.data.data);
      } else {
        throw new Error('Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw new Error('Error fetching applications');
    }
  };

  const fetchIdeaDetails = async (session) => {
    try {
      const response = await axios.get(`${apiUrl}/api/idea/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.data.success) {
        setIdea(response.data.data);
      } else {
        throw new Error('Failed to fetch idea details');
      }
    } catch (error) {
      console.error('Error fetching idea details:', error);
      throw new Error('Error fetching idea details');
    }
  };

  const filteredApplications = filter === "all"
    ? applications
    : applications.filter((app) => app.status === filter);

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      // Use stored session instead of fetching a new one
      if (!authSession) {
        throw new Error('Authentication session not available');
      }
      
      const endpoint = newStatus === "accepted" 
        ? `${apiUrl}/api/application/accept/${applicationId}`
        : `${apiUrl}/api/application/reject/${applicationId}`;
        
      const response = await axios.put(
        endpoint, 
        {}, // Empty object for request body
        {  // Third parameter is for config including headers
          headers: {
            'Authorization': `Bearer ${authSession.access_token}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success(`Developer ${newStatus} successfully`);
        
        // Refresh data using stored session
        await fetchApplicationsForIdea(authSession);
        await fetchApplicationStats(authSession);
      }
    } catch (error) {
      console.error(`Error ${newStatus} application:`, error);
      toast.error(`Failed to ${newStatus} application. Please try again.`);
    }
  };

  if (error) {
    return <ErrorPage error={error} resetError={resetError} />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Ensure `idea` exists before accessing its properties
  if (!idea) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  

  return (
    <div className="max-w-8xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Warning Banner */}
      {!teamCreation && (
        <div className="w-full bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg p-4 mb-2">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-200">Dashboard Required</h3>
              <div className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
                You need to create your team dashboard before you can manage applications. 
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-8">
        <div className='w-full sm:w-1/3 flex flex-col h-fit top-8'>
            {idea ? (
            <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md dark:shadow-primary/10 border border-border">
                <div className='mb-2 flex flex-row gap-2 border-b border-border pb-2 items-center'>
                    <ClipboardList className='w-4 h-4 sm:w-5 sm:h-5 text-primary' />
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">Summary</h2>
                </div>
                {/* Header with Company Name and Status */}
                <div className="mb-2">
                    <div className="flex items-center justify-between mt-2 mb-2">
                        <p className="text-lg sm:text-xl font-semibold text-foreground">
                            {idea.title}
                        </p>
                        <div className="flex gap-4 items-center">
                                <span className={`flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium 
                                    ${idea.status === 'open' 
                                        ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-100' 
                                        : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-100'}`}>
                                    {idea.status === 'open' 
                                        ? <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" /> 
                                        : <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />}
                                    {idea.status === 'open' ? 'Open' : 'Closed'}
                                </span>
                        </div>
                    </div>
                    
                    {/* Description */}
                    <div className='flex flex-row justify-between mt-2 mb-2'>
                        <p className="text-muted-foreground text-sm sm:text-base">
                            {idea.idea_desc}
                        </p>

                    </div>

                    {idea.dev_req && (
                      <div className='mt-1 mb-2'>
                        <div className="flex flex-wrap gap-2">
                          {idea.dev_req.split(',').map((skill, index) => (
                            <span 
                              key={index} 
                              className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-primary/10 text-primary"
                            >
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Posted Date */}
                    <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Posted on {idea.created_at ? new Intl.DateTimeFormat("en-US", {
                            dateStyle: "medium",
                        }).format(new Date(idea.created_at)) : 'Date not available'}</span>
                    </div>
                </div>
                
                <div className='w-full mt-4'>
                    <button 
                        className='w-full mt-3 sm:mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 rounded-md transition-colors text-sm'
                        onClick={handleOverlayEditIdea}
                    >
                      Edit Idea
                    </button>
                </div>
                {/* Replace CircularProgress with Stat Cards */}
                <div className='mt-8 grid grid-cols-3 sm:grid-cols-3 gap-4'>
                    {/* Accepted Applications */}
                    <div className='bg-green-100 dark:bg-green-900/30 rounded-lg p-4'>
                        <div className='flex flex-col items-center'>
                            <span className='text-xl sm:text-2xl font-bold text-green-800 dark:text-green-100'>{stats.accepted}</span>
                            <span className='text-xs sm:text-sm text-green-700 dark:text-green-200'>Accepted</span>
                        </div>
                    </div>
                    {/* Pending Applications */}
                    <div className='bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-4'>
                        <div className='flex flex-col items-center'>
                            <span className='text-xl sm:text-2xl font-bold text-yellow-800 dark:text-yellow-100'>{stats.pending}</span>
                            <span className='text-xs sm:text-sm text-yellow-700 dark:text-yellow-200'>Pending</span>
                        </div>
                    </div>
                    {/* Rejected Applications */}
                    <div className='bg-red-100 dark:bg-red-900/30 rounded-lg p-4'>
                        <div className='flex flex-col items-center'>
                            <span className='text-xl sm:text-2xl font-bold text-red-800 dark:text-red-100'>{stats.rejected}</span>
                            <span className='text-xs sm:text-sm text-red-700 dark:text-red-200'>Rejected</span>
                        </div>
                    </div>
                </div>
                <div className='w-full mt-6'>
                    <button 
                        className={`w-full mt-3 sm:mt-4 text-primary-foreground font-medium py-2 rounded-md transition-colors text-sm
                            ${teamCreation 
                                ? 'bg-primary hover:bg-primary/90' 
                                : 'bg-primary hover:bg-primary/40 animate-dashboard-blink'
                            }`}
                        onClick={handleOverlayViewMyTeam}
                    >
                        {teamCreation ? "Manage Team" : "Create Dashboard"}
                    </button>
                </div>
            </div>
            ) : (
            <div className="text-center py-12 bg-card rounded-xl shadow-md dark:shadow-primary/10 border border-border">
                <div className="mb-4 text-muted-foreground">
                    <XCircle className="w-16 h-16 mx-auto" />
                </div>
                <p className="text-xl text-foreground font-medium">Currently Unavailable</p>
                <p className="text-muted-foreground mt-2">Try again in some time</p>
            </div>
            )}
        </div>
        <div className="w-full sm:w-4/5 space-y-8">
            {/* Applications Section */}
            <div className={`bg-card text-card-foreground p-6 rounded-xl shadow-md dark:shadow-primary/10 border border-border ${!teamCreation ? 'opacity-70 pointer-events-none' : ''}`}>
            {/* Filter Dropdown */}
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">Applications received</h2>  
                    <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="border border-border rounded-md p-2 text-xs transition-all duration-200 
                    focus:outline-none focus:ring-2 focus:ring-primary 
                    hover:shadow-md cursor-pointer bg-background text-foreground"
                    disabled={!teamCreation}
                    >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    </select>
                </div>

                {/* No Team Message */}
                {!teamCreation && (
                  <div className="bg-muted/50 rounded-lg p-4 text-center my-4">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 16v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"></path>
                        <path d="M9 15h3l8.5-8.5a1.5 1.5 0 0 0-3-3L9 12v3"></path>
                        <path d="M9.5 9.5 14 5"></path>
                      </svg>
                      <h3 className="text-sm sm:text-lg font-medium text-foreground mb-1">Create Dashboard First</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                        You need to create your team dashboard before you can manage applications.
                        This will set up the necessary environment for your team.
                      </p>
                    </div>
                  </div>
                )}

                {/* Applications List */}
                {teamCreation && (
                  <div className="space-y-4">
                    {filteredApplications.length === 0 && (
                      <div className="text-center py-8 bg-muted/50 rounded-lg">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 16v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"></path>
                            <path d="M9 15h3l8.5-8.5a1.5 1.5 0 0 0-3-3L9 12v3"></path>
                            <path d="M9.5 9.5 14 5"></path>
                          </svg>
                          <h3 className="text-sm sm:text-lg font-medium text-foreground mb-1">No Applications Yet</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                            You haven't received any applications yet. Hold tight!
                          </p>
                        </div>
                      </div>
                      )}
                      {filteredApplications.map((app, index) => (
                          <div key={app.id} className="bg-card border border-border rounded-lg overflow-hidden">
                              <div className="flex flex-col sm:flex-row items-center gap-4 p-4">
                                  {/* Profile Info */}
                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <span className="text-xs sm:text-sm text-muted-foreground">{index + 1}.</span>
                                      <img
                                          src={app.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.profile?.full_name || 'User')}`}
                                          alt={app.profile?.full_name}
                                          className="w-6 h-6 sm:w-10 sm:h-10 rounded-full border border-border"
                                      />
                                      <button
                                          onClick={() => setSelectedProfile(app.profile)}
                                          className="font-medium hover:text-primary transition-colors text-left text-sm sm:text-base break-normal"
                                      >
                                          {app.profile?.full_name || "Unknown"}
                                      </button>
                                  </div>

                                  {/* Links and Actions - Responsive */}
                                  <div className="flex gap-3 w-full sm:justify-start">
                                      {app.profile?.github_url && (
                                          <a
                                              href={app.profile.github_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-muted-foreground hover:text-foreground transition-colors"
                                              title="GitHub Profile"
                                          >
                                              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                                                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                              </svg>
                                          </a>
                                      )}
                                      {app.profile?.resume_url && (
                                          <a
                                              href={app.profile.resume_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-muted-foreground hover:text-foreground transition-colors"
                                              title="Resume"
                                          >
                                              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
                                          </a>
                                      )}
                                      {app.profile?.portfolio_url && (
                                          <a
                                              href={app.profile.portfolio_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-muted-foreground hover:text-foreground transition-colors"
                                              title="Portfolio"
                                          >
                                              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                                          </a>
                                      )}

                                      <button
                                        onClick={() => setSelectedApplication(app)}
                                        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors px-3 py-1 rounded-full bg-primary/10"
                                      >
                                        View Application
                                      </button>
                                  </div>

                                  {/* Status Badge */}
                                  <div className={cn(
                                      "px-3 py-1 rounded-full text-xs font-medium",
                                      app.status === "pending" && "bg-yellow-500/20 text-yellow-500",
                                      app.status === "accepted" && "bg-green-500/20 text-green-500",
                                      app.status === "rejected" && "bg-red-500/20 text-red-500"
                                  )}>
                                      {app.status}
                                  </div>

                                  {/* Action Buttons */}
                                  {teamCreation && app.status === "pending" && (
                                      <div className="flex items-center gap-2">
                                          <button
                                              onClick={() => handleStatusUpdate(app.id, "accepted")}
                                              className="p-2 rounded-lg text-green-500 hover:bg-green-500/20 transition-colors"
                                              title="Accept Application"
                                          >
                                              <Check className="w-4 h-4" />
                                          </button>
                                          <button
                                              onClick={() => handleStatusUpdate(app.id, "rejected")}
                                              className="p-2 rounded-lg text-red-500 hover:bg-red-500/20 transition-colors"
                                              title="Reject Application"
                                          >
                                              <X className="w-4 h-4" />
                                          </button>
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
                )}
            </div>
        </div>
      </div>

      {/* Edit Idea Overlay */}
      {editIdeaOverlay && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[1000]">
          <div className="bg-card text-card-foreground my-20 p-6 rounded-lg shadow-lg dark:shadow-primary/10 w-[600px] max-h-[90vh] relative overflow-y-auto modern-scrollbar border border-border">
            <button
              onClick={() => setEditIdeaOverlay(false)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              ✖
            </button>
            <EditIdea></EditIdea>
          </div>
        </div>
      )}

      {/* Profile Overlay */}
      {selectedProfile && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[1000]">
          <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg dark:shadow-primary/10 w-[400px] relative border border-border">
            <button
              onClick={() => setSelectedProfile(null)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              ✖
            </button>
            <div className="space-y-4">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <img
                  src={selectedProfile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProfile.full_name || 'User')}`}
                  alt={selectedProfile.full_name}
                  className="w-16 h-16 rounded-full border-2 border-border"
                />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{selectedProfile.full_name}</h3>
                </div>
              </div>

              {/* Skills Section */}
              {selectedProfile.skills && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.skills.split(',').map((skill, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Profile Description */}
              {selectedProfile.description && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">About</h4>
                  <p className="text-sm text-muted-foreground">{selectedProfile.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Application Overlay */}
      {selectedApplication && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[1000]">
          <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg dark:shadow-primary/10 w-[600px] relative border border-border">
            <button
              onClick={() => setSelectedApplication(null)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              ✖
            </button>
            <div className="space-y-4">
              {/* Application Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-border">
                <img
                  src={selectedApplication.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedApplication.profile?.full_name || 'User')}`}
                  alt={selectedApplication.profile?.full_name}
                  className="w-12 h-12 rounded-full border-2 border-border"
                />
                <div>
                  <button
                    onClick={() => {
                      setSelectedProfile(selectedApplication.profile);
                      setSelectedApplication(null);
                    }}
                    className="text-lg font-semibold text-foreground hover:text-primary transition-colors text-left"
                  >
                    {selectedApplication.profile?.full_name}
                  </button>
                  <p className="text-sm text-muted-foreground">Application Details</p>
                </div>
                <div className="ml-auto">
                  <div className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    selectedApplication.status === "pending" && "bg-yellow-500/20 text-yellow-500",
                    selectedApplication.status === "accepted" && "bg-green-500/20 text-green-500",
                    selectedApplication.status === "rejected" && "bg-red-500/20 text-red-500"
                  )}>
                    {selectedApplication.status}
                  </div>
                </div>
              </div>

              {/* Application Content */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Pitch</h4>
                <div className="bg-accent/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedApplication.pitch}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Initializing overlay */}
      {showInitializing && (
        <Initializing 
          onComplete={() => {
            setShowInitializing(false);
            navigate(`/manage-team/${id}`);
          }} 
        />
      )}

      {/* Add global styles for the animations */}
      <style jsx global>{`
        @keyframes loadingBar {
          0% { width: 0; }
          50% { width: 100%; }
          100% { width: 0; }
        }
        
        @keyframes fadeSlideIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes dashboard-blink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
        
        .animate-loadingBar {
          animation: loadingBar 2s ease-in-out infinite;
        }
        
        .animate-fadeSlideIn {
          animation: fadeSlideIn 0.5s ease-out forwards;
        }

        .animate-dashboard-blink {
          animation: dashboard-blink 2s ease-in-out infinite;
        }
        
        .scale-102 {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default IdeaDetails;
