import React, { useEffect, useState, useMemo } from 'react';
import supabase from '../lib/supabase';
import { Rocket, Users, Calendar, ArrowRight, Search, RefreshCcw, Filter, AlertTriangle, X, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SkillSelect from '@/components/ui/SkillSelect';
import ErrorPage from '../components/ErrorPage';
import { Textarea } from "@/components/ui/textarea";

function IdeasList() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showOnboardingWarning, setShowOnboardingWarning] = useState(true);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [boarded, setBoarded] = useState(false);
  const [applyOverlay, setApplyOverlay] = useState(false);
  const [pitchText, setPitchText] = useState('');
  const [applyingToIdea, setApplyingToIdea] = useState(null);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [pitchValidation, setPitchValidation] = useState({ loading: false, valid: null, message: '' });

  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    console.log('Component mounted');
    checkUser();
  }, []);

  const checkUser = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }

      setSession(session);
      setUser(session.user);
      
      try {
        // Run both functions in parallel but handle their errors individually
        const [ideasResult, onboardingResult] = await Promise.allSettled([
          fetchIdeas(session),
          checkOnboardingStatus(session)
        ]);
        
        // Handle potential errors from each promise
        if (ideasResult.status === 'rejected') {
          console.error('Error fetching ideas:', ideasResult.reason);
          setError(new Error(ideasResult.reason?.message || 'Failed to fetch ideas'));
        }
        
        if (onboardingResult.status === 'rejected') {
          console.error('Error checking onboarding:', onboardingResult.reason);
          // Just log this error but don't set it as the main error
        }
      } catch (err) {
        console.error('Error in parallel operations:', err);
        setError(err);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const resetError = () => {
    setError(null);
    if (session) {
      fetchIdeas(session);
    } else {
      checkUser();
    }
  };

  const checkOnboardingStatus = async (session) => {
    try {
      const response = await axios.get(`${apiUrl}/api/idealist/verify-onboarding`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.data.success && response.data.onboarding) {
        setShowOnboardingWarning(false);
        setBoarded(true);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      throw error;
    }
  };

  async function fetchIdeas(session) {
    try {
      const response = await axios.get(`${apiUrl}/api/idea`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const { success, data } = response.data;
      
      if (success) {
        setIdeas(data || []);
        console.log('Fetched ideas:', data);
        return data;
      } else {
        throw new Error("Failed to fetch ideas");
      }
    } catch (error) {
      console.error('Unexpected Error:', error);
      throw error;
    }
  }
  

  async function handleApply(ideaId) {
    if (!session.user) {
      toast.error('Please sign in to apply');
      return;
    }

    if (submitting) return;

    if (!boarded) {
      toast.error('Complete your profile to apply for ideas', { 
        duration: 5000,
        icon: '⛔️'
      });
      return;
    }

    setApplyingToIdea(ideaId);
    setPitchText('');
    setApplyOverlay(true);
  }

  async function submitApplication() {
    if (pitchText.trim().length < 200) {
      toast.error('Please provide a more detailed pitch (at least 200 characters)');
      return;
    }

    setSubmitting(true);
    setPitchValidation({ loading: true, valid: null, message: '' });

    try {
      const response = await axios.post(`${apiUrl}/api/idealist/apply/${applyingToIdea}`, {
        pitch: pitchText
      }, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log(response.data);

      if (response.data.validationError) {
        setPitchValidation({ 
          loading: false, 
          valid: false, 
          message: response.data.message 
        });
        // Remove toast for validation errors - show in UI only
      } else if (response.data.success) {
        setPitchValidation({ loading: false, valid: true, message: '' });
        toast.success(`${response.data.message}`);
        setApplyOverlay(false);
        setApplyingToIdea(null);
        setPitchText('');
        setPitchValidation({ loading: false, valid: null, message: '' });
      } else {
        setPitchValidation({ loading: false, valid: false, message: '' });
        toast.error('There is some error in submitting your application');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setPitchValidation({ loading: false, valid: false, message: '' });
      toast.error(`An unexpected error occurred: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  // Function to reset all states when closing the overlay
  const closeApplyOverlay = () => {
    setApplyOverlay(false);
    setApplyingToIdea(null);
    setPitchText('');
    setPitchValidation({ loading: false, valid: null, message: '' });
  }

  const handleRefresh = () => {
    //on refresh, reset all filter and randomize the ideas
    setFilter('all');
    setSelectedSkills([]);
    setSearchQuery(''); 

    //randomize the ideas
    setRefreshLoading(true);
    setTimeout(() => {
      const shuffledIdeas = ideas.sort(() => Math.random() - 0.5);
      setIdeas(shuffledIdeas);
      setRefreshLoading(false);
    }, 1500); // Slightly longer to show the animation
  };

  const filteredIdeas = useMemo(() => {
    return ideas.filter(idea => {
      // Text search match
      const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          idea.idea_desc.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter match
      const matchesStatus = filter === 'all' || idea.status === filter;

      // Skills filter match
      const matchesSkills = selectedSkills.length === 0 || 
                          (idea.dev_req && selectedSkills.some(skill => 
                            idea.dev_req.toLowerCase().includes(skill.toLowerCase())
                          ));
      
      return matchesSearch && matchesStatus && matchesSkills;
    });
  }, [ideas, searchQuery, filter, selectedSkills]);

  // Status indicator component similar to the one in OnboardingForm
  const StatusIndicator = ({ status }) => {
    if (status.loading) {
      return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
    }
    if (status.valid === true) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    if (status.valid === false) {
      return <XCircle className="w-4 h-4 text-destructive" />;
    }
    return null;
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
  

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex flex-col gap-4">
          <div className="relative w-full">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center text-muted-foreground">
              <Search className="w-5 h-5" />
            </div>
            <Input
              type="text"
              placeholder="Search by idea name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full bg-white dark:bg-background hover:border-primary/50 focus:border-primary transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-3 justify-between">
            <div className="flex-1">
              <SkillSelect
                selectedSkills={selectedSkills}
                setSelectedSkills={setSelectedSkills}
                text="Filter by skills..."
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-white dark:bg-background px-3 py-2 text-sm hover:border-primary/50 focus:border-primary transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Ideas</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>

              <Button
                onClick={handleRefresh}
                size="icon"
                variant="ghost"
                className="h-10 w-10 hover:text-primary transition-colors"
                disabled={loading}
              >
                <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showOnboardingWarning && (
        <div className="max-w-7xl mx-auto mb-8">
          <Alert className="bg-gradient-to-r from-yellow-50/80 to-orange-50/80 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-900/50">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400">
                  Chief, Complete Your Profile! 🚀
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  Take a moment to complete your onboarding and unlock the full potential of our platform.
                </p>
              </div>
              <Button 
                variant="outline"
                className="bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition-colors ml-2"
                onClick={() => navigate('/onboarding')}
              >
                Complete Now
              </Button>
            </div>
          </Alert>
        </div>
      )}

      {refreshLoading ? (
        <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <h3 className="mt-8 text-xl font-semibold text-foreground animate-pulse">
            Fetching latest ideas just for you
          </h3>
          <p className="mt-2 text-muted-foreground text-sm">
            Curating the perfect selection...
          </p>
        </div>
      ) : session.user && filteredIdeas.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredIdeas.map((idea) => (
            <div key={idea.id} className="bg-card text-card-foreground rounded-xl shadow-md dark:shadow-primary/10 overflow-hidden hover:shadow-lg transition-all border border-border flex flex-col h-full">
              <div className="p-6 flex flex-col flex-grow">
                <div className='flex flex-col flex-grow'>
                  <div className="flex items-center mb-4">
                    <img
                      src={idea.founder.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(idea.founder.full_name || 'Founder')}`}
                      alt={idea.founder.full_name || 'Founder'}
                      className="w-10 h-10 rounded-full mr-4"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{idea.title}</h3>
                      <p className="text-sm text-muted-foreground">by {idea.founder.full_name || 'Founder'}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                      <Rocket className="w-4 h-4 mr-2 text-primary" />
                      <span>Description</span>
                  </div>
                  
                  <p className="text-muted-foreground mb-4 line-clamp-3">{idea.idea_desc}</p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Rocket className="w-4 h-4 mr-2 text-primary" />
                      <span>Requirements</span>
                    </div>
                      
                    {idea.dev_req && (
                        <div className="mt-4">
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
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2 text-primary" />
                      <span>Posted {new Date(idea.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                </div>

                <div className='mt-auto pt-4'>
                  <button
                    onClick={() => handleApply(idea.id)}
                    disabled={submitting}
                    className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md 
                      bg-primary text-primary-foreground hover:bg-primary/90 
                      focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 
                      disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Applying...' : (
                      <>
                        Apply Now <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-foreground mb-2">No ideas found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}

      {applyOverlay && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[1000]">
          <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg dark:shadow-primary/10 w-[600px] relative border border-border">
            <button
              onClick={closeApplyOverlay}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Apply for this Idea</h2>
              <p className="text-muted-foreground">Tell the founder why you're interested and what skills you bring to the project.</p>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Your Pitch</label>
                <div className="relative">
                  <Textarea
                    value={pitchText}
                    onChange={(e) => setPitchText(e.target.value)}
                    placeholder="Explain why you're interested in this idea and what skills you can contribute..."
                    className="min-h-[200px] resize-none pr-8"
                  />
                  <div className="absolute right-2 top-6">
                    <StatusIndicator status={pitchValidation} />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{pitchText.length} characters</span>
                  <span className={pitchText.length < 200 ? "text-red-500" : "text-green-500"}>
                    {pitchText.length < 200 ? `${200 - pitchText.length} more characters needed` : "Minimum length reached"}
                  </span>
                </div>
                {pitchValidation.valid === false && pitchValidation.message && (
                  <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                    {pitchValidation.message}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={closeApplyOverlay}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitApplication}
                  disabled={submitting || pitchText.trim().length < 200}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>Apply Now <ArrowRight className="ml-2 w-4 h-4" /></>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IdeasList;