import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { User, Phone, Github, CheckCircle, XCircle, Users } from 'lucide-react';

function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    whatsapp_number: '',
    is_founder: false
  });

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }

      setUser(session.user);
      await fetchProfile(session.user.id);
      await fetchApplications(session.user.id);
      await fetchIdeas(session.user.id);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          whatsapp_number: data.whatsapp_number || '',
          is_founder: data.is_founder || false
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  async function fetchApplications(userId) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          ideas (
            company_name,
            founder_id,
            idea_desc,
            dev_req,
            partner_term,
            equity_term,
            status
          ),
          profiles (
            full_name,
            whatsapp_number
          )
        `)
        .eq('profile_id', userId);  // Fetch applications based on profile_id (userId)
  
      if (error) throw error;
  
      // Update state with fetched data (or empty array if no data is found)
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  }

  const handleToggleApplications = async (ideaId) => {
    try {
      setIdeas(prevIdeas =>
        prevIdeas.map(idea =>
          idea.id === ideaId
            ? { ...idea, showApplications: !idea.showApplications }
            : idea
        )
      );

      // Fetch applications when opening
      const ideaToUpdate = ideas.find(idea => idea.id === ideaId);
      if (!ideaToUpdate?.showApplications) {
        await fetchApplicationsForIdea(ideaId);
      }
    } catch (error) {
      console.error('Error toggling applications:', error);
      setError('Error toggling applications');
    }
  };

  const fetchApplicationsForIdea = async (ideaId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          profiles (
            full_name,
            github_url,
            whatsapp_number
          )
        `)
        .eq('idea_id', ideaId);

      if (error) throw error;

      // Update the specific idea with its applications
      setIdeas(prevIdeas =>
        prevIdeas.map(idea =>
          idea.id === ideaId
            ? { ...idea, applications: data }
            : idea
        )
      );
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Error fetching applications');
    } finally {
      setLoading(false);
    }
  };
  
  
  async function fetchIdeas(userId) {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select(`
          *,
          applications (
            id,
            pitch,
            status,
            profiles (
              full_name,
              github_url,
              whatsapp_number
            )
          )
        `)
        .eq('founder_id', userId);

      if (error) throw error;
      setIdeas(data || []);
    } catch (error) {
      console.error('Error fetching ideas:', error);
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...formData,
          updated_at: new Date()
        });

      if (error) throw error;
      alert('Profile updated successfully!');
      await fetchProfile(user.id);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  const handleApplicationStatus = async (ideaId, applicationId, status) => {
    try {
      setLoading(true);
      
      // Fetch the full application data first
      const { data: applicationData, error: fetchError } = await supabase
        .from('applications')
        .select(`
          *,
          profiles (
            full_name,
            github_url,
            whatsapp_number
          )
        `)
        .eq('id', applicationId)
        .single();
  
      if (fetchError) throw fetchError;
  
      // Update status in database
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);
  
      if (updateError) throw updateError;
  
      // Update ideas state with full application data
      setIdeas(prevIdeas =>
        prevIdeas.map(idea => {
          if (idea.id === ideaId) {
            return {
              ...idea,
              applications: idea.applications.map(app =>
                app.id === applicationId 
                  ? { ...applicationData, status } 
                  : app
              )
            };
          }
          return idea;
        })
      );
  
      // Update applications state
      setApplications(prevApplications =>
        prevApplications.map(app =>
          app.id === applicationId 
            ? { ...applicationData, status }
            : app
        )
      );
  
      alert(`Application ${status} successfully!`);
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Error updating application status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Profile Section */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <User className="w-6 h-6 mr-2" />
            Profile Settings
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                WhatsApp Number
              </label>
              <input
                type="text"
                name="whatsapp_number"
                value={formData.whatsapp_number}
                onChange={handleChange}
                placeholder="+1234567890"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_founder"
                id="is_founder"
                checked={formData.is_founder}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_founder" className="ml-2 block text-sm text-gray-900">
                I am a founder
              </label>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Update Profile
            </button>
          </form>
        </div>

        {/* Applications Section */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold mb-6">Your Applications</h2>
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg">{app.ideas.company_name}</h3>
                <p className="text-sm text-gray-600 mb-2">{app.ideas.idea_desc}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="w-4 h-4 mr-2" />
                  <span>Equity Share: {app.ideas.equity_term}%</span>
                </div>
                <div className="mt-2 flex items-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    app.status === 'pending' ? 'bg-green-100 text-green-800' :
                    app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                  {app.status === 'accepted' && app.profiles?.whatsapp_number && (
                    <a
                      href={`https://wa.me/${app.profiles.whatsapp_number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 text-green-600 hover:text-green-700 flex items-center"
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Contact Founder
                    </a>
                  )}
                </div>
              </div>
            ))}
            {applications.length === 0 && (
              <p className="text-gray-500 text-center py-4">No applications yet</p>
            )}
          </div>
        </div>

     {/* Updated Posted Ideas Section */}
     {formData.is_founder && (
          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-md mt-8">
            <h2 className="text-2xl font-bold mb-6">Your Posted Ideas</h2>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <div className="space-y-6">
              {ideas.map((idea) => (
                <div key={idea.id} className="border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-2">{idea.company_name}</h3>
                  <div className="space-y-2 mb-4">
                    <p className="text-gray-600">{idea.idea_desc}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Developer Requirements: {idea.dev_req}</span>
                      <span>Partnership Terms: {idea.partner_term}</span>
                      <span>Equity Offered: {idea.equity_term}%</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleToggleApplications(idea.id)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    disabled={loading}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {idea.showApplications ? 'Hide Applications' : 'View Applications'}
                  </button>

                  {idea.showApplications && (
                    <div className="mt-4 space-y-4">
                      <h4 className="font-medium">Pending Applications:</h4>
                      {loading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                        </div>
                      ) : (
                        <>
                          {/* Show pending applications */}
                          {idea.applications?.filter(app => app.status === 'pending').length > 0 ? (
                            idea.applications
                              .filter(app => app.status === 'pending')
                              .map((app) => (
                                <div key={app.id} className="bg-gray-50 p-4 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                      <User className="w-4 h-4 mr-2" />
                                      <span className="font-medium">{app.profiles.full_name}</span>
                                    </div>
                                    <div className="space-x-2">
                                      <button
                                        onClick={() => handleApplicationStatus(idea.id, app.id, 'accepted')}
                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                        disabled={loading}
                                      >
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => handleApplicationStatus(idea.id, app.id, 'rejected')}
                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                        disabled={loading}
                                      >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        Reject
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-gray-600">{app.pitch}</p>
                                  <div className="mt-2">
                                    {app.profiles.github_url && (
                                      <a
                                        href={app.profiles.github_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-gray-600 hover:text-gray-800"
                                      >
                                        <Github className="w-4 h-4 mr-1" />
                                        GitHub Profile
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))
                          ) : (
                            <p className="text-gray-500 text-center py-4">No pending applications</p>
                          )}

                          {/* Show accepted applications separately */}
                          {idea.applications?.some(app => app.status === 'accepted') && (
                            <div className="mt-6">
                              <h4 className="font-medium mb-4">Accepted Applications:</h4>
                              {idea.applications
                                .filter(app => app.status === 'accepted')
                                .map((app) => (
                                  <div key={app.id} className="bg-green-50 p-4 rounded-lg mb-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <User className="w-4 h-4 mr-2" />
                                        <span className="font-medium">{app.profiles.full_name}</span>
                                      </div>
                                      {app.profiles.whatsapp_number && (
                                        <a
                                          href={`https://wa.me/${app.profiles.whatsapp_number}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-600 hover:text-green-700"
                                        >
                                          <Phone className="w-4 h-4 mr-1" />
                                          Contact Developer
                                        </a>
                                      )}
                                    </div>
                                    <p className="text-gray-600 mt-2">{app.pitch}</p>
                                    {app.profiles.github_url && (
                                      <a
                                        href={app.profiles.github_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-gray-600 hover:text-gray-800 mt-2"
                                      >
                                        <Github className="w-4 h-4 mr-1" />
                                        GitHub Profile
                                      </a>
                                    )}
                                  </div>
                                ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {ideas.length === 0 && (
                <p className="text-gray-500 text-center py-4">No ideas posted yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;