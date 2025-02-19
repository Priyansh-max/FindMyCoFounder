import React, { useEffect, useState } from 'react';
import supabase from '../lib/supabase';
import { Rocket, Users, Calendar, ArrowRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';

function IdeasList() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();

  useEffect(() => {
    console.log('Component mounted');
    checkUser();
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">Startup Ideas</h1>
        <p className="text-xl text-muted-foreground">Connect with founders and build the next big thing</p>
      </div>

      {user && ideas.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
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
          <h3 className="text-xl font-medium text-foreground mb-2">No ideas posted yet</h3>
          <p className="text-muted-foreground">Check back later for new opportunities!</p>
        </div>
      )}
    </div>
  );
}

export default IdeasList;