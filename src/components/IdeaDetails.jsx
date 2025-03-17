import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase'; // Ensure you import your Supabase instance
import { Users, Phone, ClipboardList, XCircle, Clock, CheckCircle, Undo, X,ArrowRight, Check } from "lucide-react";
import CircularProgress from '@/components/ui/CircularProgress';
import EditIdea from '../props/EditIdea';
import ErrorPage from './ErrorPage';
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
  const [stats, setStats] = useState({
    applications_received: {
      total: 0,
      accepted: 0,
      pending: 0,
      rejected: 0
    }
  });

  useEffect(() => {
    fetchSession();
  }, [id]); // Runs when `id` changes

  const resetError = () => {
    setError(null);
    fetchSession();
  };

  async function fetchSession(){
    try{
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/');
      setLoading(false);
      return;
    }

    const fetchPromises = [
      fetchApplicationsForIdea(session),
      fetchIdeaDetails(session),
      fetchApplicationStats(session),
      checkTeamCreation(session)
    ];

    // Wait for all fetch operations to complete
    await Promise.all(fetchPromises);
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
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        // Call backend to create team
        const response = await axios.post(`http://localhost:5000/api/manage-team/create-team/${id}`, {}, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
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
      const response = await axios.get(`http://localhost:5000/api/manage-team/check-team/${id}`, {
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
      const response = await axios.get(`http://localhost:5000/api/data/application-stats/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.data.success) {
        setStats(response.data.data);
        console.log('Fetched stats:', response.data.data);
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
      setLoading(true);
      console.log(session);
      console.log(id);
      const response = await axios.get(`http://localhost:5000/api/application/details/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      console.log(response);
      if (response.data.success) {
        setApplications(response.data.data);
        console.log(applications);
      } else {
        throw new Error('Failed to fetch applications');
      }
      console.log(applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw new Error('Error fetching applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchIdeaDetails = async (session) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/idea/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      console.log(response);
      if (response.data.success) {
        setIdea(response.data.data);
        console.log(idea);
      } else {
        throw new Error('Failed to fetch idea details');
      }
    } catch (error) {
      console.error('Error fetching idea details:', error);
      throw new Error('Error fetching idea details');
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = filter === "all"
  ? applications
  : applications.filter((app) => app.status === filter);

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
        const { error } = await supabase
            .from('applications')
            .update({ status: newStatus })
            .eq('id', applicationId);

        if (error) throw error;

        // Refresh the applications list
        fetchApplicationsForIdea();

    } catch (error) {
        console.error('Error updating application status:', error);
        // You might want to add some error handling UI here
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
    <div className="max-w-8xl mx-auto px-4 py-8 flex gap-8">
        <div className='w-1/3 flex flex-col h-fit top-8'>
            {idea ? (
            <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md dark:shadow-primary/10 border border-border">
                <div className='mb-2 flex flex-row gap-2 border-b border-border pb-2 items-center'>
                    <ClipboardList className='w-5 h-5 text-primary' />
                    <h2 className="text-2xl font-bold text-foreground">Summary</h2>
                </div>
                {/* Header with Company Name and Status */}
                <div className="mb-2">
                    <div className="flex items-center justify-between mt-2 mb-2">
                        <p className="text-xl font-semibold text-foreground">
                            {idea.title}
                        </p>
                        <div className="flex gap-4 items-center">
                                <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium 
                                    ${idea.status === 'open' 
                                        ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-100' 
                                        : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-100'}`}>
                                    {idea.status === 'open' 
                                        ? <CheckCircle className="w-4 h-4" /> 
                                        : <XCircle className="w-3 h-3" />}
                                    {idea.status === 'open' ? 'Open' : 'Closed'}
                                </span>
                        </div>
                    </div>
                    
                    {/* Description */}
                    <div className='flex flex-row justify-between mt-2 mb-2'>
                        <p className="text-muted-foreground">
                            {idea.idea_desc}
                        </p>

                    </div>

                    {idea.dev_req && (
                      <div className='mt-1 mb-2'>
                        <div className="flex flex-wrap gap-2">
                          {idea.dev_req.split(',').map((skill, index) => (
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

                    {/* Posted Date */}
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Clock className="w-4 h-4" />
                        <span>Posted on {idea.created_at ? new Intl.DateTimeFormat("en-US", {
                            dateStyle: "medium",
                        }).format(new Date(idea.created_at)) : 'Date not available'}</span>
                    </div>
                </div>
                
                <div className='w-full mt-4'>
                    <button 
                        className='p-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg w-full transition-colors'
                        onClick={handleOverlayEditIdea}
                    >
                        <p className='text-lg'>Edit Idea</p>
                    </button>
                </div>
                <div className='flex flex-col items-center mt-8'>
                    <div className="relative group">
                        <CircularProgress
                        total={stats.total}
                        accepted={stats.accepted}
                        pending={stats.pending}
                        rejected={stats.rejected}
                        content="Applications received"
                        />
                        {/* Hover Stats */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity         duration-200">
                            <div className="absolute top-1/4 left-full ml-2">
                                <div className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-100 px-2 py-1 rounded text-sm whitespace-nowrap">
                                    Accepted: {stats.accepted}
                                </div>
                            </div>
                            <div className="absolute top-1/2 left-full ml-2 -translate-y-1/2">
                                <div className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-100 px-2 py-1 rounded text-sm whitespace-nowrap">
                                    Pending: {stats.pending}
                                </div>
                            </div>
                            <div className="absolute bottom-1/4 left-full ml-2">
                                <div className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-100 px-2 py-1 rounded text-sm whitespace-nowrap">
                                    Rejected: {stats.rejected}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='w-full mt-6'>
                    <button 
                        className='w-full flex items-center justify-center p-1 text-lg rounded-md text-primary-foreground bg-primary hover:bg-primary/90 transition-colors'
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
    <div className="w-3/4 space-y-8">
        {/* Applications Section */}
        <div className="bg-card text-card-foreground p-6 rounded-xl shadow-md dark:shadow-primary/10 border border-border">
        {/* Filter Dropdown */}
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Applications received</h2>
                <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-border rounded-md p-2 text-sm transition-all duration-200 
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
            <div className="space-y-4">
                {filteredApplications.map((app, index) => (
                    <div key={app.id} className="bg-card border border-border rounded-lg overflow-hidden">
                        <div className="flex items-center gap-4 p-3">
                            {/* Index */}
                            <span className="w-6 text-sm text-muted-foreground">{index + 1}.</span>
                            
                            {/* Profile Info */}
                            <div className="flex items-center gap-3 w-[250px]">
                                <img
                                    src={app.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.profile?.full_name || 'User')}`}
                                    alt={app.profile?.full_name}
                                    className="w-8 h-8 rounded-full border border-border"
                                />
                                <button
                                    onClick={() => setSelectedProfile(app.profile)}
                                    className="font-medium truncate hover:text-primary transition-colors text-left"
                                >
                                    {app.profile?.full_name || "Unknown"}
                                </button>
                            </div>

                            {/* Links */}
                            <div className="flex items-center gap-2">
                                {app.profile?.github_url && (
                                    <a
                                        href={app.profile.github_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                        title="GitHub Profile"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
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
                                        <ClipboardList className="w-5 h-5" />
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
                                        <Users className="w-5 h-5" />
                                    </a>
                                )}
                            </div>

                            {/* View Application Button */}
                            <button
                                onClick={() => setSelectedApplication(app)}
                                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                                View Application
                            </button>

                            {/* Spacer */}
                            <div className="flex-1" />

                            {/* Status Badge */}
                            <div className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                app.status === "pending" && "bg-yellow-500/20 text-yellow-500",
                                app.status === "accepted" && "bg-green-500/20 text-green-500",
                                app.status === "rejected" && "bg-red-500/20 text-red-500"
                            )}>
                                {app.status}
                            </div>

                            {/* Action Buttons */}
                            {app.status === "pending" && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleStatusUpdate(app.id, "accepted")}
                                        className="p-1.5 rounded-lg text-green-500 hover:bg-green-500/20 transition-colors"
                                        title="Accept Application"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(app.id, "rejected")}
                                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/20 transition-colors"
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
        </div>
    </div>
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
</div>
  );
};

export default IdeaDetails;
