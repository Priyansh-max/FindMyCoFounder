import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLightbulb, FaSignOutAlt, FaGithub, FaHandshake } from 'react-icons/fa';
import { Moon, Sun, Menu, X } from 'lucide-react';
import supabase from "../lib/supabase";
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import { cn } from "@/lib/utils";

const Navbar = ({user}) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [navigate]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('nav')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const handleSignIn = async () => {
    try {
      const loadingToast = toast.loading('Signing you in...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/idealist`,
          skipBrowserRedirect: false,
        }
      });

      if (error) throw error;

      setTimeout(() => {
        toast.dismiss(loadingToast);
      }, 2000);
      
    } catch (error) {
      console.error('Error signing in:', error.message);
      toast.error('Failed to sign in with GitHub');
    }
  };

  const handleSignOut = async () => {
    try {
      const loadingToast = toast.loading('Signing out...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      toast.dismiss(loadingToast);
      navigate('/');
      toast.success('Signed out successfully');
      
    } catch (error) {
      console.error('Error signing out:', error.message);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  const handlePostIdea = async () => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      navigate('/post-idea');
      
    } catch (error) {
      console.error('Error checking founder status:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-lg w-full z-50 relative transition-colors duration-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center text-base sm:text-xl font-bold text-gray-800 dark:text-white">
            <FaHandshake className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-4 text-black-600 dark:text-white hover:text-black-800" />
            <p className='hover:underline text-base sm:text-xl'>FindMyTeam</p>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            {user ? (
              <>
                <button
                  onClick={handlePostIdea}
                  className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <FaLightbulb className="w-5 h-5 mr-2" />
                  Post Idea
                </button>
                <Link 
                  to="/profile" 
                  className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <FaUser className="w-5 h-5 mr-2" />
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <FaSignOutAlt className="w-5 h-5 mr-2" />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={handleSignIn}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600"
              >
                <FaGithub className="w-5 h-5 mr-2" />
                Sign in with GitHub
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden space-x-4">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "md:hidden absolute left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg transition-all duration-300 ease-in-out",
            isOpen ? "opacity-100 visible" : "opacity-0 invisible h-0"
          )}
        >
          <div className="px-4 py-3 space-y-3">
            {user ? (
              <>
                <button
                  onClick={handlePostIdea}
                  className="flex items-center w-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm py-2"
                >
                  <FaLightbulb className="w-4 h-4 mr-3" />
                  Post Idea
                </button>
                <Link 
                  to="/profile" 
                  className="flex items-center w-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm py-2"
                >
                  <FaUser className="w-4 h-4 mr-3" />
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm py-2 border-t border-gray-200 dark:border-gray-800"
                >
                  <FaSignOutAlt className="w-4 h-4 mr-3" />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center w-full px-4 py-2 text-sm font-medium text-white bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-md"
              >
                <FaGithub className="w-4 h-4 mr-3" />
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
