import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import supabase from '../lib/supabase'; // Ensure you import your Supabase instance
import { Users, Phone, XCircle, Clock, CheckCircle, Undo, X,Lightbulb, Heart } from "lucide-react";
import CircularProgress from '@/components/ui/CircularProgress';

const IdeaDetails = () => {
  const { id } = useParams(); // Extracts idea ID from URL
  const [applications, setApplications] = useState([]);
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  const data = {
    total: 150,
    accepted: 50,
    pending: 50,
    rejected: 50,
  };

  useEffect(() => {
    fetchApplicationsForIdea();
    fetchIdeaDetails();
  }, [id]); // Runs when `id` changes

  const fetchApplicationsForIdea = async () => {
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
        .eq('idea_id', id); // Fetch applications related to this idea ID

      if (error) throw error;

      setApplications(data); // Store fetched applications in state
      console.log(applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Error fetching applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchIdeaDetails = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('ideas') // Replace with your actual table name
        .select('*')
        .eq('id', id)
        .single(); // Fetch only one row

      if (error) throw error;

      setIdea(data); // Store idea details in state

      if(data.founder_id){
        const { data: founderData, error: founderError } = await supabase
        .from('profiles') // Assuming 'profiles' is the table storing user details
        .select('*')
        .eq('id', data.founder_id)
        .single();

        if (founderError) throw founderError;

        setIdea((prevIdea) => ({
            ...prevIdea,
            founder: founderData, // Attach founder details to the idea
        }));

        console.log(idea);

      }
    } catch (error) {
      console.error('Error fetching idea details:', error);
      setError('Error fetching idea details');
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
  
  // Ensure `idea` exists before accessing its properties
  if (!idea) {
    return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
    );
  }
  
  // Ensure `founder` exists before accessing its properties
  if (!idea.founder) {
    return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto px-4 py-8 flex gap-8">
        <div className='w-1/4 flex flex-col top-8'>
        {idea ? (
            <div className="max-w-3xl mx-auto p-8 shadow-md rounded-lg bg-white">
                {/* Company Header */}
                <div className="mb-8 text-center">
                <h2 className="text-4xl font-bold text-gray-900 mb-3 bg-clip-text bg-gradient-to-r from-blue-600 to-purple-500">
                    {idea.company_name}
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                    {idea.idea_desc}
                </p>
                </div>

                {/* Founder Section */}
                <div className="mb-8 bg-indigo-50 p-6 rounded-xl border-l-4 border-indigo-300">
                <div className="flex items-center gap-4 mb-3">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-800">Founder Information</h3>
                </div>
                {idea.founder ? (
                    <div className="pl-2">
                    <p className="text-gray-700">
                        <span className="font-medium">Name:</span> {idea.founder.full_name}
                    </p>
                    {idea.founder.bio && (
                        <p className="mt-2 text-gray-600 italic">"{idea.founder.bio}"</p>
                    )}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No founder information available</p>
                )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                <div className="bg-white p-5 rounded-xl shadow-sm flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    </div>
                    <div>
                    <p className="text-sm text-gray-500">Created By</p>
                    <p className="text-lg font-medium text-gray-800">{idea.created_by}</p>
                    </div>
                </div>
                
                <div className="bg-white p-5 rounded-xl shadow-sm flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                    </svg>
                    </div>
                    <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="text-lg font-medium text-gray-800">{idea.category}</p>
                    </div>
                </div>
                </div>

                {/* Posted Date */}
                <div className="flex items-center gap-3 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span className="text-sm">
                    {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "full",
                    timeStyle: "short",
                    }).format(new Date(idea.created_at))}
                </span>
                </div>
            </div>
            ) : (
            <div className="text-center py-12">
                <div className="mb-4 text-gray-400">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                </div>
                <p className="text-xl text-gray-500 font-medium">No idea details found</p>
                <p className="text-gray-400 mt-2">Try searching for another idea</p>
            </div>
            )}
            <div className="h-6"></div>
            
            <div className='bg-white flex flex-col shadow-md p-4 md:p-6 rounded-xl'>
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center">
                    <Users className="w-5 h-5 md:w-6 md:h-6 mr-2" />
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
                                <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm whitespace-nowrap">
                                    Accepted: {data.accepted}
                                </div>
                            </div>
                            <div className="absolute top-1/2 left-full ml-2 -translate-y-1/2">
                                <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm whitespace-nowrap">
                                    Pending: {data.pending}
                                </div>
                            </div>
                            <div className="absolute bottom-1/4 left-full ml-2">
                                <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm whitespace-nowrap">
                                    Rejected: {data.rejected}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="w-3/4 space-y-8">
            {/* Applications Section */}
            <div className="bg-white p-6 rounded-xl shadow-md">
            {/* Filter Dropdown */}
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Applications received</h2>
                    <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="border rounded-md p-2 text-sm transition-all duration-200 ease-in-out 
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 
                    hover:shadow-md cursor-pointer bg-white"
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
                    <div key={app.id} className="border rounded-lg p-4 bg-white shadow-md">
                        <div className='flex justify-between'>
                            <div>
                                {/* Company Name & Founder */}

                                <h4 className="font-semibold text-xl text-gray-900 mb-1">{app.profiles?.full_name || "Unkown"}</h4>

                                <p className="text-sm text-gray-500">
                                    <span className="font-bold">Applied on:</span>{" "}
                                    {new Intl.DateTimeFormat("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        second: "2-digit",
                                        hour12: true, // For 12-hour format
                                    }).format(new Date(app.created_at))}
                                </p>

                        
                                {/* Idea Description */}
                                <div className='flex flex-col'>
                                <p className="text-sm text-gray-500">
                                    <span className="font-semibold text-">Github url :</span> {app.profiles?.github_url || "Unknown github url"}
                                </p>
                                <p className="text-sm text-gray-500">
                                    <span className="font-bold">Portfolio link :</span> {app.profiles?.portfolio || "No portfolio link provided"}
                                </p>
                                <p className="text-sm text-gray-500">
                                    <span className="font-bold">Resume link :</span> {app.profiles?.resume || "No portfolio link provided"}
                                </p>
                                </div> 
                            </div> 

                            <div className="flex flex-col items-end space-y-4">
                                {/* Status Badge with Icon */}
                                <div className="flex items-center">
                                    <span
                                        className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        app.status === "pending"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : app.status === "accepted"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                    >
                                        {app.status === "pending" && <Clock className="w-4 h-4 mr-1" />}
                                        {app.status === "accepted" && <CheckCircle className="w-4 h-4 mr-1" />}
                                        {app.status === "rejected" && <XCircle className="w-4 h-4 mr-1" />}
                                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                            <h5 className="font-bold text-gray-800">
                                Pitch : <span className="font-normal">{app.pitch}</span>
                            </h5>
                        </div>
                    </div>
                    ))}
                    {filteredApplications.length === 0 && (
                    <p className="text-gray-500 border rounded-md text-center py-4">No applications yet</p>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default IdeaDetails;
