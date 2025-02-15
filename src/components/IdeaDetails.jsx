import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import supabase from '../lib/supabase'; // Ensure you import your Supabase instance
import { Users, Phone, ClipboardList, XCircle, Clock, CheckCircle, Undo, X,ArrowRight } from "lucide-react";
import CircularProgress from '@/components/ui/CircularProgress';
import ViewMyTeam from '../props/ViewMyTeam';
import EditIdea from '../props/EditIdea';

const IdeaDetails = () => {
  const { id } = useParams(); // Extracts idea ID from URL
  const [applications, setApplications] = useState([]);
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [editIdeaOverlay , setEditIdeaOverlay] = useState(false);
  const [viewMyTeamOverlay , setViewMyTeamOverlay] = useState(false);

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

  function handleOverlayEditIdea(){
    setEditIdeaOverlay(true);
  }

  function handleOverlayViewMyTeam(){
    setViewMyTeamOverlay(true);
  }


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

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
        const { error } = await supabase
            .from('applications')
            .update({ status: newStatus })
            .eq('id', applicationId);

        if (error) throw error;

        // Refresh the applications list
        fetchApplicationsForIdea();

    } catch (error) {
        console.error('Error updating application status:', error);
        // You might want to add some error handling UI here
    }
  };

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
            <div className="p-6 shadow-md rounded-xl bg-white border border-gray-100">
                <div className='mb-2 flex flex-row gap-2 border-b-2 pb-2 items-center'>
                    <ClipboardList className='w-5 h-5' />
                    <h2 className="text-2xl font-bold">Summary</h2>
                </div>
                {/* Header with Company Name and Status */}
                <div className="mb-2">
                    <div className="flex items-center justify-between mt-2 mb-2">
                        <p className="text-lg font-semibold text-gray-900">
                            {idea.company_name}
                        </p>
                        <div className="flex gap-4 items-center">
                                <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium 
                                    ${idea.status === 'open' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'}`}>
                                    {idea.status === 'open' 
                                        ? <CheckCircle className="w-4 h-4" /> 
                                        : <XCircle className="w-3 h-3" />}
                                    {idea.status === 'open' ? 'Open' : 'Closed'}
                                </span>
                        </div>
                    </div>
                    
                    {/* Description */}
                    <div className='flex flex-row justify-between mt-2 mb-2'>
                        <p className="text-gray-700">
                            {idea.idea_desc}
                        </p>

                    </div>

                    {/* Posted Date */}
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>Posted on {new Intl.DateTimeFormat("en-US", {
                            dateStyle: "medium",
                        }).format(new Date(idea.created_at))}</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Users className="w-4 h-4 " />
                    <h3>Posted by {idea.founder?.full_name || "Unknown"}</h3>
                </div>
                <div className='w-full mt-4'>
                    <button className='p-1 bg-green-500 hover:bg-green-600 rounded-lg w-full'
                        onClick={handleOverlayEditIdea}
                    >
                        <p className='text-white text-lg'>Edit Idea</p>
                    </button>
                </div>
                <div className='flex flex-col items-center mt-8'>
                    <div className="relative group">
                        <CircularProgress
                        total={data.total}
                        accepted={data.accepted}
                        pending={data.pending}
                        rejected={data.rejected}
                        content="Applications received"
                        />
                        {/* Hover Stats */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity         duration-200">
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
                <div className='w-full mt-6'>
                    <button className='w-full flex items-center justify-center p-1 border border-transparent text-lg rounded-md text-white bg-indigo-600 hover:bg-indigo-700'
                    onClick={handleOverlayViewMyTeam}
                    >
                        View My Team
                    </button>
                </div>
            </div>
            ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <div className="mb-4 text-gray-400">
                    <XCircle className="w-16 h-16 mx-auto" />
                </div>
                <p className="text-xl text-gray-500 font-medium">Currently Unavailable</p>
                <p className="text-gray-400 mt-2">Try again in some time</p>
            </div>
            )}
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
                                <span className="font-bold">Github url :</span> {app.profiles?.github_url || "Unknown github url"}
                            </p>
                            <p className="text-sm text-gray-500">
                                <span className="font-bold">Portfolio link :</span> {app.profiles?.portfolio || "No portfolio link provided"}
                            </p>
                            <p className="text-sm text-gray-500">
                                <span className="font-bold">Resume link :</span> {app.profiles?.resume || "No portfolio link provided"}
                            </p>
                            </div> 
                        </div> 

                        <div className="flex space-y-4">
                            <div className='flex flex-col items-end justify-between'>
                                {/* Status Badge with Icon */}
                                <div>
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
                                <div>
                                    {/* Accept/Reject Buttons for Pending Applications */}
                                    {app.status === "pending" && (
                                        <div className="flex gap-2">
                                            <button 
                                                className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                                                onClick={() => handleStatusUpdate(app.id, "accepted")}
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Accept
                                            </button>
                                            <button 
                                                className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                                onClick={() => handleStatusUpdate(app.id, "rejected")}
                                            >
                                                <X className="w-4 h-4" />
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
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
    {editIdeaOverlay && (
        <div
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[1000]"
        >
        <div
          className="bg-white my-20 p-6 rounded-lg shadow-lg w-[600px] max-h-[90vh] relative overflow-y-auto modern-scrollbar"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
          <button
            onClick={() => setEditIdeaOverlay(false)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          >
            ✖
          </button>
          <EditIdea></EditIdea>
        </div>
      </div>
    )}

    {viewMyTeamOverlay && (
        <div
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[1000]"
        >
        <div
          className="bg-white p-6 rounded-lg shadow-lg w-96 relative"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
          <button
            onClick={() => setViewMyTeamOverlay(false)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          >
            ✖
          </button>
          <ViewMyTeam></ViewMyTeam>
        </div>
      </div>
    )}
</div>
  );
};

export default IdeaDetails;
