import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { Users, Phone, XCircle, Clock, CheckCircle, Undo, X,Lightbulb, Heart, ScrollText, Github } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { RiDeleteBin6Line } from "react-icons/ri";
import { AiOutlineStop } from "react-icons/ai";
import { GrView } from "react-icons/gr";
import { Tooltip } from "react-tooltip";
import CircularProgress from '@/components/ui/CircularProgress';
import { IoDocumentTextOutline } from "react-icons/io5";
import { GoLink } from "react-icons/go";
import EditProfile from '../props/EditProfile';

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
                src="https://via.placeholder.com/60"
                alt="Profile"
                className="w-24 h-24 rounded-md object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1 text-foreground">PriyanshAgarwal</h2>
              <p className="text-muted-foreground text-sm">@PhoneNumber</p>
              <p className="text-muted-foreground text-sm">@Email</p>
            </div>
          </div>
          <div className='pt-2'>
            <p className='text-muted-foreground'>this is my description</p>
          </div>

          {/* Edit Profile Button */}
          <button 
            className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 rounded-md transition-colors"
            onClick={handleOverlay}
          >
            Edit Profile
          </button>

          {/* Location & Github */}
          <div className="mt-4 space-y-2 text-muted-foreground">
            <p className="flex items-center space-x-2">
              <Github className="w-5 h-5 text-muted-foreground" />
              <span>Github</span>
            </p>
            <p className="flex items-center space-x-2">
              <GoLink className="w-5 h-5 text-muted-foreground" />
              <span>Portfolio</span>
            </p>
            <p className="flex items-center space-x-2">
              <IoDocumentTextOutline className="w-5 h-5 text-muted-foreground" />
              <span>Resume</span>
            </p>
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
                <div className='flex justify-between'>
                  <div>
                    {/* Company Name & Founder */}

                    <h4 className="font-semibold text-lg text-foreground">{app.ideas.company_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-bold">Posted by:</span> {app.profiles?.name || "Unknown"}
                    </p>
              
                    {/* Idea Description */}
                    <div className='flex flex-col'>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-bold">Idea:</span> {app.ideas.idea_desc}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-bold">Equity Share:</span> {app.ideas.equity_term}%
                      </p>
                    </div> 
                  </div> 

                  <div className="flex flex-col items-end space-y-4">
                    {/* Status Badge with Icon */}
                    <div className="flex items-center">
                      <span
                        className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          app.status === "pending"
                            ? "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-100"
                            : app.status === "accepted"
                            ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-100"
                            : "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-100"
                        }`}
                      >
                        {app.status === "pending" && <Clock className="w-4 h-4 mr-1" />}
                        {app.status === "accepted" && <CheckCircle className="w-4 h-4 mr-1" />}
                        {app.status === "rejected" && <XCircle className="w-4 h-4 mr-1" />}
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </div>
          
                    {/* Action Buttons */}
                    {app.status === "pending" && (
                      <button
                        onClick={() => onWithdraw(app.id)}
                        className="text-yellow-600 hover:text-yellow-700 flex items-center text-sm font-medium"
                      >
                        <Undo className="w-4 h-4 mr-1" />
                        Withdraw
                      </button>
                    )}
          
                    {app.status === "accepted" && app.profiles?.whatsapp_number && (
                      <a
                        href={`https://wa.me/${app.profiles.whatsapp_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 flex items-center text-sm font-medium"
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        Contact Founder
                      </a>
                    )}
          
                    {app.status === "rejected" && (
                      <button
                        onClick={() => onRemove(app.id)}
                        className="text-red-600 hover:text-red-700 flex items-center text-sm font-medium"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-3 p-3 bg-accent rounded-lg border border-border">
                  <h5 className="text-foreground">
                    <span className="font-semibold">Pitch:</span>{" "}
                    <span className="text-muted-foreground">{app.pitch || "This is a sample pitch from the user"}</span>
                  </h5>
                </div>
              </div>
            ))}
            {filteredApplications.length === 0 && (
              <p className="text-muted-foreground border border-border rounded-md text-center py-4">No applications yet</p>
            )}
          </div>
        </div>
  
        {/* Posted Ideas Section */}
        {formData.is_founder && (
          <div className="bg-card text-card-foreground p-6 rounded-xl shadow-md dark:shadow-primary/10 border border-border">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Your Posted Ideas</h2>
            {ideas.map((idea) => (
              <div key={idea.id} className="border border-border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-2 text-foreground">{idea.company_name}</h3>
                <div className="space-y-2 mb-4">
                  <p className="text-muted-foreground">{idea.idea_desc}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Developer Requirements: {idea.dev_req}</span>
                    <span>Partnership Terms: {idea.partner_term}</span>
                    <span>Equity Offered: {idea.equity_term}%</span>
                  </div>
                </div>

                <div className='flex justify-between items-center w-full'>
                  {/* Left Group (View Details + Stop) */}
                  <div className="flex gap-x-4">
                    <button 
                      data-tooltip-id="view-tooltip"
                      onClick={() => viewDetails(idea.id)}
                      className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      <GrView className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                    
                    <button 
                      data-tooltip-id="stop-tooltip"
                      onClick={() => handleToggleApplications(idea.id)}
                      className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                    >
                      <AiOutlineStop className="w-4 h-4 mr-2" />
                      Stop
                    </button>
                  </div>

                  {/* Right (Delete Button) */}
                  <button 
                    data-tooltip-id="delete-tooltip"
                    onClick={() => handleToggleApplications(idea.id)} // Change function for deleting the post
                    className="inline-flex items-center justify-center w-10 h-10 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
                  >
                    <RiDeleteBin6Line className="w-5 h-5"/>
                  </button>

                  {/* Tooltips */}
                  <Tooltip id="view-tooltip" place="bottom" effect="solid">
                    View received applications
                  </Tooltip>
                  
                  <Tooltip id="stop-tooltip" place="bottom" effect="solid">
                    Stop receiving applications 
                  </Tooltip>

                  <Tooltip id="delete-tooltip" place="bottom" effect="solid">
                    Delete post
                  </Tooltip>
                </div>

              </div>
            ))}
            {ideas.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No ideas posted yet</p>
            )}
          </div>
        )}
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