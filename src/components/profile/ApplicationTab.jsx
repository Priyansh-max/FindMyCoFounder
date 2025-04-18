import React, { useState } from 'react';
import { Users, XCircle, Clock, CheckCircle, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const ApplicationTab = ({filteredApplications}) => {
    const [selectedApplication, setSelectedApplication] = useState(null);
    const navigate = useNavigate();

    return (
        <div>
            <div className="space-y-3">
                {filteredApplications.length === 0 ? (
                <div className="text-center py-10 bg-muted/50 rounded-lg">
                    <div className="flex flex-col items-center justify-center">
                    <svg className="h-12 w-12 text-muted-foreground mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 16v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"></path>
                        <path d="M9 15h3l8.5-8.5a1.5 1.5 0 0 0-3-3L9 12v3"></path>
                        <path d="M9.5 9.5 14 5"></path>
                    </svg>
                    <h3 className="text-lg font-medium text-foreground mb-1">No Applications Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                        You haven't applied to any ideas yet. Start exploring and find your next project!
                    </p>
                    </div>
                </div>
                ) : (
                filteredApplications.map((app, index) => (
                    <div key={app.id} className="flex flex-row items-center justify-between gap-2 p-2 sm:p-3 bg-card border border-border rounded-lg hover:border-primary/50 transition-all group">
                        {/* Number - Hidden on mobile */}
                        <span className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                            {index + 1}
                        </span>
                        
                        {/* Idea Name */}
                        <div className="flex-1 min-w-0">
                            <button
                                onClick={() => setSelectedApplication(app)}
                                className="text-left font-medium text-sm sm:text-base text-foreground hover:text-primary transition-colors truncate"
                            >
                                {app.idea?.title || "Deleted Idea"}
                            </button>
                        </div>

                        {/* Status Badge and Actions */}
                        <div className="flex flex-row items-center gap-2">
                            <div className={cn(
                                "px-2 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium flex items-center gap-1",
                                app.status === "pending" && "bg-yellow-500/20 text-yellow-500",
                                app.status === "accepted" && "bg-green-500/20 text-green-500",
                                app.status === "rejected" && "bg-red-500/20 text-red-500"
                            )}>
                                {app.status === "pending" && <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                                {app.status === "accepted" && <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                                {app.status === "rejected" && <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                                <span className="hidden sm:inline">{app.status.charAt(0).toUpperCase() + app.status.slice(1)}</span>
                                <span className="sm:hidden">{app.status.charAt(0).toUpperCase()}</span>
                            </div>

                            {/* Dashboard Button for Accepted Applications */}
                            {app.status === "accepted" && (
                                <div>
                                    {app.idea.completion_status === 'approved' ? (
                                        <div 
                                            className="flex items-center gap-1 text-[11px] sm:text-xs text-primary bg-primary/10 px-2 sm:px-3 py-1 rounded-full font-medium whitespace-nowrap"
                                        >
                                            <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                            <span className="hidden sm:inline">Completed</span>
                                            <span className="sm:hidden">Done</span>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => navigate(`/creators-lab/${app.idea.id}`)}
                                            className="flex items-center gap-1 text-[11px] sm:text-xs text-primary bg-primary/10 px-2 sm:px-3 py-1 rounded-full font-medium hover:bg-primary/20 transition-colors whitespace-nowrap"
                                        >
                                            <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                            <span className="hidden sm:inline">Creators Lab</span>
                                            <span className="sm:hidden">Lab</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))
                )}
            </div>

            {selectedApplication && (
                <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[1000] p-10">
                    <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg dark:shadow-primary/10 w-[600px] relative border border-border">
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedApplication(null)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="space-y-6">
                            {/* Header with Idea Title */}
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">{selectedApplication.idea?.title || "Deleted Idea"}</h2>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {selectedApplication.idea?.founder?.full_name || "Unknown"}
                                </p>
                            </div>

                            {/* Your Pitch - Highlighted */}
                            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-primary mb-2">Your Pitch</h3>
                                <p className="text-sm text-foreground whitespace-pre-wrap">{selectedApplication.pitch}</p>
                            </div>

                            {/* Idea Description */}
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">Idea Description</h3>
                                <p className="text-sm text-muted-foreground">{selectedApplication.idea?.idea_desc || "Deleted Idea"}</p>
                            </div>

                            {/* Required Skills */}
                            {selectedApplication.idea?.dev_req && (
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Required Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedApplication.idea.dev_req.split(',').map((skill, index) => (
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
                        </div>
                    </div>
                </div>
            )}
        </div>   
    )
}

export default ApplicationTab;