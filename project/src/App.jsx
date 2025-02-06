import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import supabase from "./lib/supabase"; // Make sure the import path is correct
import Navbar from "./components/Navbar";
import IdeasList from "./components/IdeasList";
import IdeaForm from "./components/IdeaForm";
import Profile from "./components/Profile";
import IdeaDetails from './components/IdeaDetails'
import LandingPage from "./components/LandingPage";

function App() {
  console.log("app rendered")
  const [user, setUser] = useState(null);

  console.log(user);

  return (
    <Router>
      <AuthHandler user={user} setUser={setUser} />
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/idealist" element={<IdeasList />} />
            {/* <Route 
              path="/idealist" 
              element={user ? <IdeasList /> : <Navigate to="/" />}/> */}
            <Route
              path="/post-idea"
              element={user ? <IdeaForm /> : <Navigate to="/" />}
            />
            <Route
              path="/profile"
              element={user ? <Profile /> : <Navigate to="/" />}
            />
            <Route
              path="/details/:id"
              element={user ? <IdeaDetails /> : <Navigate to="/" />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// New component to handle auth and navigation
function AuthHandler({ user, setUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      // Only redirect from landing page to idealist if user is logged in
      if (session?.user && window.location.pathname === '/') {
        navigate('/idealist');
      }else if (!session?.user && window.location.pathname !== '/') {
        navigate('/');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      // Only redirect on specific auth events
      if (event === 'SIGNED_IN') {
        navigate('/idealist');
      } else if (event === 'SIGNED_OUT') {
        navigate('/');
      }
      // Don't redirect on other auth state changes
    });

    return () => subscription.unsubscribe();
  }, [navigate, setUser]);

  return null;
}

export default App;
