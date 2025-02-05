import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLightbulb, FaSignOutAlt, FaGithub, FaHandshake } from 'react-icons/fa';
import supabase from "../lib/supabase";
import { toast } from 'react-hot-toast';

const Navbar = ({ onLogin }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: false,
          scopes: 'read:user user:email',
          queryParams: {
            prompt: 'consent'  // This forces GitHub to show the authorization screen
          }
        }
      });

      if (error) throw error;

    } catch (error) {
      console.error('Error signing out:', error.message);
      toast.error('Failed to sign in with GitHub');
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      try {
        const loadingToast = toast.loading('Signing out...');
        
        // Sign out from Supabase
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;

        // Clear any GitHub session cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        toast.dismiss(loadingToast);
        toast.success('Signed out successfully');
        
        // Force reload the page to clear any cached states
        window.location.href = '/';
        
      } catch (error) {
        console.error('Error signing out:', error.message);
        toast.error('Failed to sign out. Please try again.');
      }
    }
  };

  const handlePostIdea = async () => {
    if (user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, is_founder')
        .eq('id', user.id)
        .single();

      if (error || !profile.is_founder) {
        alert('Only founders can post an idea.');
        return;
      }

      // Redirect to the "Post Idea" page if the user is a founder
      navigate('/post-idea');
    }
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center text-xl font-bold text-gray-800">
            <FaHandshake className="w-8 h-8 mr-4 text-black-600 hover:text-black-800" />
            <p className='hover:underline'>FindMyCoFounder</p>
          </Link>
          <div className="flex items-center space-x-10">
            {user ? (
              <>
                <button
                  onClick={handlePostIdea}  // On click, call the updated function
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <FaLightbulb className="w-5 h-5 mr-2" />
                  Post Idea
                </button>
                <Link to="/profile" className="flex items-center text-gray-600 hover:text-gray-900">
                  <FaUser className="w-5 h-5 mr-2" />
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <FaSignOutAlt className="w-5 h-5 mr-2" />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={handleSignIn}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700"
              >
                <FaGithub className="w-5 h-5 mr-2" />
                Sign in with GitHub
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
