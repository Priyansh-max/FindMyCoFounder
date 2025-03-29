import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import supabase from "./lib/supabase"; // Make sure the import path is correct
import Navbar from "./components/Navbar";
import IdeasList from "./pages/IdeasList";
import IdeaForm from "./pages/IdeaForm";
import Profile from "./pages/Profile";
import IdeaDetails from './pages/IdeaDetails'
import OnboardingForm from "./pages/OnboardingForm";
import LandingPage from "./pages/LandingPage";
import Manage from './pages/Manage';
import CreatorsLab from './pages/CreatorsLab';
import Admin from './pages/Admin';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import { toast } from 'react-hot-toast';

function App() {
  console.log("app rendered")
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log(user);

  return (
    <ThemeProvider>
      <Router>
        <AuthHandler user={user} setUser={setUser} setIsLoading={setIsLoading} />
        <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
          <Navbar user={user} />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={user ? <Navigate to="/idealist" /> : <LandingPage />} />
              <Route
                path="/idealist"
                element={isLoading ? null : user ? <IdeasList /> : <Navigate to="/" />}
              />
              <Route
                path="/post-idea"
                element={isLoading ? null : user ? <IdeaForm /> : <Navigate to="/" />}
              />
              <Route
                path="/onboarding"
                element={isLoading ? null : user ? <OnboardingForm /> : <Navigate to="/" />}
              />
              <Route
                path="/profile"
                element={isLoading ? null : user ? <Profile /> : <Navigate to="/" />}
              />
              <Route
                path="/details/:id"
                element={isLoading ? null : user ? <IdeaDetails /> : <Navigate to="/" />}
              />
              <Route
                path="/manage-team/:ideaId"
                element={isLoading ? null : user ? <Manage /> : <Navigate to="/" />}
              />
              <Route
                path="/creators-lab/:ideaId"
                element={isLoading ? null : user ? <CreatorsLab /> : <Navigate to="/" />}
              />
              <Route
                path="/admin"
                element={isLoading ? null : user ? <Admin /> : <Navigate to="/" />}
              />
            </Routes>
          </main>
          <Toaster position="bottom-right" />
        </div>
      </Router>
    </ThemeProvider>
  );
}

// New component to handle auth and navigation
function AuthHandler({ user, setUser, setIsLoading }) {
  const navigate = useNavigate();
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event); // For debugging
      
      if (event === 'INITIAL_SESSION') {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }

      if (event === 'SIGNED_IN') {
        if (session) {
          setUser(session.user);
        }
        // Show welcome message only on fresh sign in from landing page
        if (window.location.pathname === '/') {
          setHasShownWelcome(true);
          toast.success('Signed in successfully!');
          navigate('/idealist');
        }
      } 
      else if (event === 'SIGNED_OUT') {
        setUser(null);
        setHasShownWelcome(false);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, setUser, setIsLoading]);

  return null;
}

export default App;
