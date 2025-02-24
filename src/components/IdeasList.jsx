import React, { useEffect, useState, useMemo } from 'react';
import supabase from '../lib/supabase';
import { Rocket, Users, Calendar, ArrowRight, Search, RefreshCcw, Filter, AlertTriangle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SkillSelect from '@/components/ui/SkillSelect';

function IdeasList() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showOnboardingWarning, setShowOnboardingWarning] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Component mounted');
    checkUser();
    checkOnboardingStatus();
  }, []);

  // Watch for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchIdeas();
      } else {
        setIdeas([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    if (session?.user) {
      fetchIdeas();
    }
  }

  const checkOnboardingStatus = async () => {
        setShowOnboardingWarning(true);
  };

  // const checkOnboardingStatus = async () => {
  //   try {
  //     const { data: { user } } = await supabase.auth.getUser();
  //     if (user) {
  //       const { data: profile } = await supabase
  //         .from('profiles')
  //         .select('*')
  //         .eq('id', user.id)
  //         .single();
        
  //       console.log(profile);
  //       setShowOnboardingWarning(!profile || !profile.full_name);
  //     }
  //   } catch (error) {
  //     console.error('Error checking onboarding status:', error);
  //   }
  // };

  async function fetchIdeas() {
    try {
      // Get the current authenticated user
      const { data: { session } } = await supabase.auth.getSession();
  
      if (!session?.user) {
        console.log("User not signed in");
        return;
      }
  
      const userId = session.user.id;
  
      // Query ideas, excluding those posted by the current user
      // const { data, error } = await supabase.rpc('get_ideas_with_metadata');

      const { data, error } = await supabase
      .from('ideas')
      .select(`
        *,
        profiles:founder_id (
          full_name,
          github_url
        )
      `)
      .eq('status', 'open')
      .not('founder_id', 'eq', userId)
      .order('created_at', { ascending: false });
  
      if (error) {
        console.error("Supabase Query Error:", error);
        return;
      }
      console.log(data)
  
      setIdeas(data || []);

      console.log(ideas);
      setLoading(false);
    } catch (error) {
      console.error('Unexpected Error:', error);
    }
  }
  

  async function handleApply(ideaId) {
    if (!user) {
      alert('Please sign in to apply');
      return;
    }

    if (submitting) return;

    const pitch = prompt('Why are you interested in this idea? (This will be your pitch to the founder)');
    if (!pitch) {
      alert('Application cancelled');
      return;
    }

    setSubmitting(true);

    try {
      // Check for existing application
      const { data: existingApp, error: fetchError } = await supabase
        .from('applications')
        .select('id')
        .eq('idea_id', ideaId)
        .eq('profile_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking existing application:', fetchError);
        alert(`Error: ${fetchError.message}`);
        return;
      }

      if (existingApp) {
        alert('You have already applied for this idea!');
        return;
      }

      // Submit new application
      const { error: insertError } = await supabase
        .from('applications')
        .insert({
          idea_id: ideaId,
          profile_id: user.id,
          pitch
        });

      if (insertError) {
        console.error('Error submitting application:', insertError);
        alert(`Error: ${insertError.message}`);
        return;
      }

      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Unexpected error:', error);
      alert(`An unexpected error occurred: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  const handleRefresh = () => {
    setLoading(true);
    fetchIdeas();
  };

  const filteredIdeas = useMemo(() => {
    return ideas.filter(idea => {
      // Text search match
      const matchesSearch = idea.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
              className="pl-10 w-full bg-background hover:border-primary/50 focus:border-primary transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-3 justify-between">
            <div className="flex-1">
              <SkillSelect
                selectedSkills={selectedSkills}
                setSelectedSkills={setSelectedSkills}
                placeholder="Filter by skills..."
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm hover:border-primary/50 focus:border-primary transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
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

      {user && filteredIdeas.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredIdeas.map((idea) => (
            <div key={idea.id} className="bg-card text-card-foreground rounded-xl shadow-md dark:shadow-primary/10 overflow-hidden hover:shadow-lg transition-all border border-border">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <img
                    src={idea.profiles.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(idea.profiles.full_name)}`}
                    alt={idea.profiles.full_name}
                    className="w-10 h-10 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{idea.company_name}</h3>
                    <p className="text-sm text-muted-foreground">by {idea.profiles.full_name}</p>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-4 line-clamp-3">{idea.idea_desc}</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="w-4 h-4 mr-2 text-primary" />
                    <span>Equity Share: {idea.equity_term}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Rocket className="w-4 h-4 mr-2 text-primary" />
                    <span>Requirements: {idea.dev_req}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2 text-primary" />
                    <span>Posted {new Date(idea.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

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
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-foreground mb-2">No ideas found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}

export default IdeasList;