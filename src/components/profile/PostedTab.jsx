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
    // Create a local copy of ideas that we can modify
    const [localIdeas, setLocalIdeas] = useState([]);
    
    // Sync local ideas with parent ideas when they change
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
          // Find the idea in our local state
          const ideaIndex = localIdeas.findIndex(idea => idea.id === ideaId);
          if (ideaIndex === -1) return;
          
          const ideaToUpdate = localIdeas[ideaIndex];
          const newStatus = ideaToUpdate.status === "open" ? "closed" : "open";
          
          // Create a copy of localIdeas to avoid direct state mutation
          const updatedIdeas = [...localIdeas];
          
          // Update status in our local copy immediately for responsive UI
          updatedIdeas[ideaIndex] = {
            ...updatedIdeas[ideaIndex],
            status: newStatus
          };
          
          setLocalIdeas(updatedIdeas);
          
          // Show success toast
          toast.success(`Idea ${newStatus === 'open' ? 'reopened' : 'closed'} successfully`);
          
          // Send API request in the background
          await axios.put(`https://findmycofounder.onrender.com/api/idea/status/${ideaId}`, { status: newStatus }, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
        } catch (error) {
          console.error('Error updating idea status:', error);
          toast.error('Failed to update idea status');
          
          // Revert local state on error
          setLocalIdeas(ideas);
        }
    };

    return (
        <div>
        {localIdeas.filter(idea => idea.completion_status !== 'approved').map((idea) => {
          return (
            <div key={idea.id} className="mb-6 last:mb-0 border border-border rounded-lg p-4 hover:border-primary/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
                    idea.status === 'open' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                  }`}>
                    <Lightbulb className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12 group-hover:animate-pulse" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground truncate pr-4 mb-1">{idea.title}</h3>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(idea.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`flex-shrink-0 flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      idea.completion_status === 'review'
                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-100"
                        : idea.status === "open"
                          ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-100"
                          : "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-100"
                    }`}
                  >
                    {idea.completion_status === 'review' ? (
                      <>
                        <Info className="w-3 h-3 mr-1" />
                        Under Review
                      </>
                    ) : idea.status === "open" ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Open
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 mr-1" />
                        Closed
                      </>
                    )}
                  </span>

                  <div className="flex items-center gap-2 ml-2">
                    {idea.completion_status === 'review' ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Contact support for queries</span>
                      </div>
                    ) : (
                      <>
                        <Tooltip id={`view-tooltip-${idea.id}`} place="top" effect="solid">
                          View received applications
                        </Tooltip>
                        <button 
                          data-tooltip-id={`view-tooltip-${idea.id}`}
                          onClick={() => viewDetails(idea.id)}
                          className="p-2 text-blue-500 hover:text-blue-600 transition-colors"
                        >
                          <GrView className="w-5 h-5" />
                        </button>

                        <Tooltip id={`status-tooltip-${idea.id}`} place="top" effect="solid">
                          {idea.status === "open" ? "Close applications" : "Reopen applications"}
                        </Tooltip>
                        <button 
                          data-tooltip-id={`status-tooltip-${idea.id}`}
                          onClick={() => handleIdeaStatus(idea.id)}
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
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </div>
    )
}

export default PostedTab