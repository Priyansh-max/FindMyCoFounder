import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import supabase from "./lib/supabase"; // Make sure the import path is correct
import Navbar from "./components/Navbar";
import IdeasList from "./components/IdeasList";
import IdeaForm from "./components/IdeaForm";
import Profile from "./components/Profile";
import IdeaDetails from './components/IdeaDetails'

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if the user is authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for authentication state changes
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar onLogin={handleLogin} />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<IdeasList />} />
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

export default App;
