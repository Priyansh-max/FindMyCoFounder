import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { Users, Phone, XCircle, Clock, CheckCircle, Undo, X, Lightbulb, Heart, ScrollText, Github, PlayCircle, Calendar, Info } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { RiDeleteBin6Line } from "react-icons/ri";
import { AiOutlineStop } from "react-icons/ai";
import { GrView } from "react-icons/gr";
import { Tooltip } from "react-tooltip";
import CircularProgress from '@/components/ui/CircularProgress';
import { IoDocumentTextOutline } from "react-icons/io5";
import { GoLink } from "react-icons/go";
import EditProfile from '../props/EditProfile';
import axios from 'axios';
import { toast } from 'react-hot-toast';

function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [EditprofileOverlay , setEditprofileOverlay] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    whatsapp_number: '',
    github_url : '',
    portfolio_url : '',
    resume_url : '',
    description : '',
    is_founder: false
  });

  const data = {
    total: 150,
    accepted: 50,
    pending: 50,
    rejected: 50,
  };

  const datareceived = {
    total: 0,
    accepted: 30,
    pending: 10,
    rejected: 40,
  };

  useEffect(() => {
    checkUser();
  }, []);

  function handleOverlay(){
    setEditprofileOverlay(true);
  }

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }

      setUser(session.user);
      await fetchProfile(session.user.id);
      await fetchApplications();
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

      console.log(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  //done
  async function fetchApplications() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
  
      if (!session?.user) {
        console.log("User not signed in");
        return;
      }

      const response = await axios.get('http://localhost:5000/api/application/user', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const { data, error } = response.data;
      
      if (error) {
        throw new Error(error);
      }

      setApplications(data || []);
      console.log('Fetched applications:', data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch applications');
    }
  }

  const viewDetails = async(ideaId) => {
    try{
      if(ideaId != null){
        navigate(`/details/${ideaId}`)
      }

    }catch(error){
      console.error("Error viewing details: ",error);
      setError("Error viewing details");
    }
  }

  // const handleToggleApplications = async (ideaId) => {
  //   try {
  //     setIdeas(prevIdeas =>
  //       prevIdeas.map(idea =>
  //         idea.id === ideaId
  //           ? { ...idea, showApplications: !idea.showApplications }
  //           : idea
  //       )
  //     );

  //     // Fetch applications when opening
  //     const ideaToUpdate = ideas.find(idea => idea.id === ideaId);
  //     if (!ideaToUpdate?.showApplications) {
  //       await fetchApplicationsForIdea(ideaId);
  //     }
  //   } catch (error) {
  //     console.error('Error toggling applications:', error);
  //     setError('Error toggling applications');
  //   }
  // };

  // const fetchApplicationsForIdea = async (ideaId) => {
  //   try {
  //     setLoading(true);
  //     const { data, error } = await supabase
  //       .from('applications')
  //       .select(`
  //         *,
  //         profiles (
  //           full_name,
  //           github_url,
  //           whatsapp_number
  //         )
  //       `)
  //       .eq('idea_id', ideaId);

  //     if (error) throw error;

  //     // Update the specific idea with its applications
  //     setIdeas(prevIdeas =>
  //       prevIdeas.map(idea =>
  //         idea.id === ideaId
  //           ? { ...idea, applications: data }
  //           : idea
  //       )
  //     );
  //   } catch (error) {
  //     console.error('Error fetching applications:', error);
  //     setError('Error fetching applications');
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  
  
  async function fetchIdeas(userId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
  
      if (!session?.user) {
        console.log("User not signed in");
        return;
      }

      const response = await axios.get('http://localhost:5000/api/idea/user', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const { success, data } = response.data;
      
      if (success) {
        setIdeas(data || []);
        console.log('Fetched ideas:', data);
      } else {
        throw new Error('Failed to fetch ideas');
      }
    } catch (error) {
      console.error('Error fetching ideas:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch ideas');
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

  const filteredApplications = filter === "all"
  ? applications
  : applications.filter((app) => app.status === filter);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto px-4 py-8 flex gap-8">
      <div className='w-1/3 flex flex-col h-fit top-8'>
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md dark:shadow-primary/10 border border-border">
          {/* Profile Header */}
          <div className='flex justify-content'>
            <div className='mr-4'>
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-20 h-20 rounded-md object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1 text-foreground">{profile.full_name}</h2>
              <p className="text-muted-foreground text-sm">{profile.email}</p>
            </div>
          </div>
          <div className='pt-2'>
            <p className='text-muted-foreground'>{profile.description}</p>
          </div>

          {/* Skills Section */}
          {profile.skills && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {profile.skills.split(',').map((skill, index) => (
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

          {/* Edit Profile Button */}
          <button 
            className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 rounded-md transition-colors"
            onClick={handleOverlay}
          >
            Edit Profile
          </button>

          {/* Location & Github */}
          <div className="mt-4 space-y-2 text-muted-foreground">
          {profile.github_url && (
            <div className='flex'>
            <a 
              href={profile.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 hover:text-primary transition-colors"
            >
              <Github className="w-5 h-5" />
              <span>{new URL(profile.github_url).pathname.substring(1)}</span>
            </a>
            </div>
          )}
          {profile.portfolio_url && (
            <div className='flex'>
            <a 
              href={profile.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 hover:text-primary transition-colors"
            >
              <GoLink className="w-5 h-5" />
              <span>{new URL(profile.portfolio_url).hostname}</span>
            </a>
            </div>
          )}
          {profile.resume_url && (
            <div className='flex'>
            <a 
              href={profile.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 hover:text-primary transition-colors"
            >
              <IoDocumentTextOutline className="w-5 h-5" />
              <span>Resume</span>
            </a>
            </div>
          )}
          </div>
        </div>

        <div className="h-6"></div>

        {/* Numbers */}
        <div className='bg-card text-card-foreground flex flex-col shadow-md dark:shadow-primary/10 p-4 md:p-6 rounded-xl border border-border'>
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center text-foreground">
            <ScrollText className="w-5 h-5 md:w-6 md:h-6 mr-2 text-primary" />
            Overview
          </h2>

          {/* Applications Sent Section */}
          <div className='flex flex-col items-center'>
            <div className="relative group">
              <CircularProgress
                total={data.total}
                accepted={data.accepted}
                pending={data.pending}
                rejected={data.rejected}
                content="Applications Sent"
              />
              {/* Hover Stats */}
              <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="absolute top-1/4 left-full ml-2">
                  <div className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-100 px-2 py-1 rounded text-sm whitespace-nowrap">
                    Accepted: {data.accepted}
                  </div>
                </div>
                <div className="absolute top-1/2 left-full ml-2 -translate-y-1/2">
                  <div className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-100 px-2 py-1 rounded text-sm whitespace-nowrap">
                    Pending: {data.pending}
                  </div>
                </div>
                <div className="absolute bottom-1/4 left-full ml-2">
                  <div className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-100 px-2 py-1 rounded text-sm whitespace-nowrap">
                    Rejected: {data.rejected}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-border mt-4"></div>

          {/* Application Received Section */}
          <div className='flex flex-col items-center mt-4'>
            <div className="relative group">
              <CircularProgress
                total={datareceived.total}
                accepted={datareceived.accepted}
                pending={datareceived.pending}
                rejected={datareceived.rejected}
                content="Applications Received"
              />
              {/* Hover Stats */}
              <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="absolute top-1/4 left-full ml-2">
                  <div className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-100 px-2 py-1 rounded text-sm whitespace-nowrap">
                    Accepted: {datareceived.accepted}
                  </div>
                </div>
                <div className="absolute top-1/2 left-full ml-2 -translate-y-1/2">
                  <div className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-100 px-2 py-1 rounded text-sm whitespace-nowrap">
                    Pending: {datareceived.pending}
                  </div>
                </div>
                <div className="absolute bottom-1/4 left-full ml-2">
                  <div className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-100 px-2 py-1 rounded text-sm whitespace-nowrap">
                    Rejected: {datareceived.rejected}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-border mt-4"></div>

          {/* Stats Section */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4">
            <div className="flex flex-col items-center p-2 md:p-3 bg-accent rounded shadow-md dark:shadow-primary/5 w-full">
              <div className='flex flex-row items-center justify-center gap-1 md:gap-2'>
                <Lightbulb className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 text-primary" />
                <span className="font-medium text-xs md:text-sm text-foreground">Ideas</span>
              </div>
              <span className="text-lg md:text-xl font-bold mt-1 text-foreground">{data.accepted}</span>
            </div>

            <div className="flex flex-col items-center p-2 md:p-3 bg-accent rounded shadow-md dark:shadow-primary/5 w-full">
              <div className='flex flex-row items-center justify-center gap-1 md:gap-2'>
                <Users className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 text-primary" />
                <span className="font-medium text-xs md:text-sm text-foreground">Contacts</span>
              </div>
              <span className="text-lg md:text-xl font-bold mt-1 text-foreground">{data.pending}</span>
            </div>

            <div className="flex flex-col items-center p-2 md:p-3 bg-accent rounded shadow-md dark:shadow-primary/5 w-full">
              <div className='flex flex-row items-center justify-center gap-1 md:gap-2'>
                <Heart className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 text-primary" />
                <span className="font-medium text-xs md:text-sm text-foreground">Likes</span>
              </div>
              <span className="text-lg md:text-xl font-bold mt-1 text-foreground">{data.rejected}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side Content */}
      <div className="w-4/5 space-y-8">
        {/* Applications Section */}
        <div className="bg-card text-card-foreground p-6 rounded-xl shadow-md dark:shadow-primary/10 border border-border">
          {/* Filter Dropdown */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Your Applications</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded-md p-2 text-sm transition-all duration-200 ease-in-out 
              focus:outline-none focus:ring-2 focus:ring-primary 
              hover:shadow-md cursor-pointer bg-background text-foreground border-border"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Change it to display all the pitches and you have sent*/}
          {/* display company name hosted by idea description then pitch by the user   */}
          <div className="space-y-4"> 
            {filteredApplications.map((app) => (
              <div key={app.id} className="border border-border rounded-lg p-4 bg-card text-card-foreground shadow-md dark:shadow-primary/10">
                <div className='flex justify-between items-start'>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-lg text-foreground">{app.idea.title}</h4>
                      <span
                        className={`flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          app.status === "pending"
                            ? "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-100"
                            : app.status === "accepted"
                            ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-100"
                            : "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-100"
                        }`}
                      >
                        {app.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                        {app.status === "accepted" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {app.status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </div>
                    <div className="bg-accent/30 rounded-lg border border-border p-3">
                      <p className="text-muted-foreground text-sm">
                        <strong>Pitch - </strong> {app.pitch || "This is a sample pitch from the user"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button 
                      onClick={() => {
                        const element = document.getElementById(`idea-details-${app.id}`);
                        const isExpanded = element.style.maxHeight !== "0px" && element.style.maxHeight !== "";
                        element.style.maxHeight = isExpanded ? "0px" : `${element.scrollHeight}px`;
                      }}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-accent"
                    >
                      <Info className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Expandable Idea Details */}
                <div 
                  id={`idea-details-${app.id}`}
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: "0px" }}
                >
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={app.idea.founder.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.idea.founder.full_name || 'Founder')}`}
                        alt={app.idea.founder.full_name || 'Founder'}
                        className="w-6 h-6 rounded-full"
                      />
                      <p className="text-sm text-muted-foreground">
                        Posted by <span className="font-medium text-foreground">{app.idea.founder.full_name || "Unknown"}</span>
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-foreground mb-1">Description</h5>
                      <p className="text-sm text-muted-foreground">{app.idea.idea_desc}</p>
                    </div>

                    {app.idea.dev_req && (
                      <div>
                        <h5 className="text-sm font-medium text-foreground mb-2">Required Skills</h5>
                        <div className="flex flex-wrap gap-2">
                          {app.idea.dev_req.split(',').map((skill, index) => (
                            <span 
                              key={index} 
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary"
                            >
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {app.idea.additional_details && (
                      <div>
                        <h5 className="text-sm font-medium text-foreground mb-1">Additional Details</h5>
                        <p className="text-sm text-muted-foreground">{app.idea.additional_details}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredApplications.length === 0 && (
              <p className="text-muted-foreground border border-border rounded-md text-center py-4">No applications yet</p>
            )}
          </div>
        </div>
  
        {/* Posted Ideas Section */}

        <div className="bg-card text-card-foreground p-6 rounded-xl shadow-md dark:shadow-primary/10 border border-border">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Your Posted Ideas</h2>
            {ideas.map((idea) => (
              <div key={idea.id} className="border border-border rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-foreground">{idea.title}</h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          idea.status === "open"
                            ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-100"
                            : "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-100"
                        }`}
                      >
                        {idea.status === "open" ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Open
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-1" />
                            Closed
                          </>
                        )}
                      </span>
                      <span className="flex items-center text-xs text-muted-foreground">
                        {new Date(idea.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Tooltip id={`view-tooltip-${idea.id}`} place="top" effect="solid">
                      View received applications
                    </Tooltip>
                    <button 
                      data-tooltip-id={`view-tooltip-${idea.id}`}
                      onClick={() => viewDetails(idea.id)}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <GrView className="w-5 h-5" />
                    </button>

                    <Tooltip id={`status-tooltip-${idea.id}`} place="top" effect="solid">
                      {idea.status === "open" ? "Stop receiving applications" : "Start receiving applications"}
                    </Tooltip>
                    <button 
                      data-tooltip-id={`status-tooltip-${idea.id}`}
                      onClick={() => handleToggleApplications(idea.id)}
                      className={`p-2 transition-colors ${
                        idea.status === "open"
                          ? "text-orange-500 hover:text-orange-600"
                          : "text-green-500 hover:text-green-600"
                      }`}
                    >
                      {idea.status === "open" ? (
                        <AiOutlineStop className="w-5 h-5" />
                      ) : (
                        <PlayCircle className="w-5 h-5" />
                      )}
                    </button>

                    <Tooltip id={`delete-tooltip-${idea.id}`} place="top" effect="solid">
                      Delete post
                    </Tooltip>
                    <button 
                      data-tooltip-id={`delete-tooltip-${idea.id}`}
                      onClick={() => handleToggleApplications(idea.id)}
                      className="p-2 text-destructive hover:text-destructive/90 transition-colors"
                    >
                      <RiDeleteBin6Line className="w-5 h-5"/>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground">{idea.idea_desc}</p>
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

                  {/* Additional Details Section */}
                  <div className="mt-4">
                    <p className="text-muted-foreground text-sm">
                      {idea.additional_details || "No additional details set"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {ideas.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No ideas posted yet</p>
            )}
          </div>
      </div>

      {/* edit profile overlay */}

      {EditprofileOverlay && (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[1000] p-10">
        <div
          className="bg-card text-card-foreground my-20 p-6 rounded-lg shadow-lg dark:shadow-primary/10 w-[500px] max-h-[90vh] relative overflow-y-auto modern-scrollbar border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setEditprofileOverlay(false)}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            ✖
          </button>
          <EditProfile />
        </div>
      </div>
      )}
    </div>


  );
  
}

export default Profile;