import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLightbulb, FaSignOutAlt, FaGithub, FaHandshake } from 'react-icons/fa';
import supabase from "../lib/supabase";
import { toast } from 'react-hot-toast';

const Navbar = ({user}) => {
  const navigate = useNavigate();

  const handleSignIn = async () => {
    try {
      const loadingToast = toast.loading('Connecting to GitHub...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/idealist`,
          skipBrowserRedirect: false,
        }
      });

      if (error) throw error;

      toast.dismiss(loadingToast);
      
    } catch (error) {
      console.error('Error signing in:', error.message);
      toast.error('Failed to sign in with GitHub');
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      try {
        const loadingToast = toast.loading('Signing out...');
        
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;

        toast.dismiss(loadingToast);
        toast.success('Signed out successfully');
        
        navigate('/');
        
      } catch (error) {
        console.error('Error signing out:', error.message);
        toast.error('Failed to sign out. Please try again.');
      }
    }
  };

  const handlePostIdea = async () => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    console.log("woefbewjbfew")

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, is_founder')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (!profile.is_founder) {
        toast.error('Only founders can post an idea');
        return;
      }

      navigate('/post-idea');
      
    } catch (error) {
      console.error('Error checking founder status:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <nav className="bg-white shadow-lg w-full z-40 relative">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center text-xl font-bold text-gray-800">
            <FaHandshake className="w-8 h-8 mr-4 text-black-600 hover:text-black-800" />
            <p className='hover:underline'>FindMyTeam</p>
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
