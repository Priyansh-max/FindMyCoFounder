import React, { useState, useEffect } from "react";
import {  XCircle, Clock, CheckCircle, Lightbulb, PlayCircle,  Info,} from "lucide-react";
import { Tooltip } from "react-tooltip";
import { AiOutlineStop } from "react-icons/ai";
import { GrView } from "react-icons/gr";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from 'react-hot-toast';

const PostedTab = ({ideas , session}) => {
    const navigate = useNavigate();
    const [localIdeas, setLocalIdeas] = useState([]);
    const apiUrl = import.meta.env.VITE_BACKEND_URL;
    
    useEffect(() => {
      setLocalIdeas(ideas);
    }, [ideas]);

    const viewDetails = async(ideaId) => {
        try{
          if(ideaId != null){
            navigate(`/details/${ideaId}`)
          }
        }catch(error){
          console.error("Error viewing details: ",error);
          toast.error("Error viewing details");
        }
    }

    const handleIdeaStatus = async (ideaId) => {
        try {
          const ideaIndex = localIdeas.findIndex(idea => idea.id === ideaId);
          if (ideaIndex === -1) return;
          
          const ideaToUpdate = localIdeas[ideaIndex];
          const newStatus = ideaToUpdate.status === "open" ? "closed" : "open";
          
          const updatedIdeas = [...localIdeas];
          updatedIdeas[ideaIndex] = {
            ...updatedIdeas[ideaIndex],
            status: newStatus
          };
          
          setLocalIdeas(updatedIdeas);
          toast.success(`Idea ${newStatus === 'open' ? 'reopened' : 'closed'} successfully`);
          
          await axios.put(`${apiUrl}/api/idea/status/${ideaId}`, { status: newStatus }, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
        } catch (error) {
          console.error('Error updating idea status:', error);
          toast.error('Failed to update idea status');
          setLocalIdeas(ideas);
        }
    };

    return (
        <div className="space-y-3">
          {localIdeas.filter(idea => idea.completion_status !== 'approved').map((idea) => (
            <div key={idea.id} className="flex flex-row items-center justify-between gap-2 p-2 sm:p-3 bg-card border border-border rounded-lg hover:border-primary/50 transition-all group">
              {/* Icon - Hidden on mobile */}
              <div className="hidden sm:block flex-shrink-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
                  idea.status === 'open' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                }`}>
                  <Lightbulb className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12 group-hover:animate-pulse" />
                </div>
              </div>

              {/* Title and Date */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-lg font-semibold text-foreground truncate pr-2 sm:pr-4">{idea.title}</h3>
                <span className="hidden sm:flex text-xs text-muted-foreground items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {new Date(idea.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>

              {/* Status and Actions */}
              <div className="flex flex-row items-center gap-2">
                <span
                  className={`flex-shrink-0 flex items-center px-2 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium ${
                    idea.completion_status === 'review'
                      ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-100"
                      : idea.status === "open"
                        ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-100"
                        : "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-100"
                  }`}
                >
                  {idea.completion_status === 'review' ? (
                    <>
                      <Info className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                      <span className="hidden sm:inline">Under Review</span>
                      <span className="sm:hidden">Review</span>
                    </>
                  ) : idea.status === "open" ? (
                    <>
                      <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                      Open
                    </>
                  ) : (
                    <>
                      <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                      Closed
                    </>
                  )}
                </span>

                <div className="flex items-center gap-1 sm:gap-2">
                  {idea.completion_status === 'review' ? (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <span className="hidden sm:inline">Contact support for queries</span>
                      <span className="sm:hidden">Contact Support</span>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => viewDetails(idea.id)}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors whitespace-nowrap"
                      >
                        <span className="hidden sm:inline">View Applications</span>
                        <span className="sm:hidden">View</span>
                      </button>

                      <button 
                        onClick={() => handleIdeaStatus(idea.id)}
                        className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                          idea.status === "open"
                            ? "bg-orange-500 hover:bg-orange-600 text-white"
                            : "bg-green-500 hover:bg-green-600 text-white"
                        }`}
                      >
                        {idea.status === "open" ? (
                          <>
                            <span className="hidden sm:inline">Stop Receiving</span>
                            <span className="sm:hidden">Stop</span>
                          </>
                        ) : (
                          <>
                            <span className="hidden sm:inline">Start Receiving</span>
                            <span className="sm:hidden">Start</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {localIdeas.filter(idea => idea.completion_status !== 'approved').length === 0 && (
            <div className="text-center py-10 bg-muted/50 rounded-lg">
              <div className="flex flex-col items-center justify-center">
                <Lightbulb className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium text-foreground mb-1">No Ideas Posted</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  You haven't posted any ideas yet. Start by creating a new idea!
                </p>
              </div>
            </div>
          )}
        </div>
    )
}

export default PostedTab