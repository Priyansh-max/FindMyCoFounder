import React from "react";
import { Users, Clock, Github, PlayCircle, Calendar, ExternalLink, FileCode, } from "lucide-react";

const ContributedTab = ({contributedProjects}) => {
    return (
        <div className="space-y-6">
            {contributedProjects.map((project, index) => (
                <div key={index} className="border border-border rounded-xl overflow-hidden bg-background hover:border-primary/50 transition-all duration-200">
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                            {/* Project Logo */}
                            <div className="flex-shrink-0 w-full sm:w-auto">
                                {project.logo_url ? (
                                    <img 
                                        src={project.logo_url} 
                                        alt={project.title} 
                                        className="w-full sm:w-20 h-30 sm:h-20 rounded-md object-cover border border-border"
                                    />
                                ) : (
                                    <div className="w-full sm:w-20 h-40 sm:h-20 rounded-md bg-primary/10 flex items-center justify-center">
                                        <FileCode className="w-8 h-8 text-primary" />
                                    </div>
                                )}
                            </div>

                            {/* Project Information */}
                            <div className="flex-1 w-full">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                                    <h3 className="text-sm sm:text-lg font-bold text-foreground">{project.title}</h3>
                                    <span className="text-xs sm:text-sm px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                                        Approved
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-3 mt-2 text-muted-foreground">
                                    <div className="flex items-center gap-1 text-xs sm:text-sm">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        {new Date(project.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs sm:text-sm">
                                        <Clock className="w-4 h-4 text-primary" />
                                        {project.duration} days
                                    </div>
                                    <div className="flex items-center gap-1 text-xs sm:text-sm">
                                        <Users className="w-4 h-4 text-primary" />
                                        {project.project_type === 'team' ? 'Team Project' : 'Solo Project'}
                                    </div>
                                    {project.repo_url && (
                                        <div className="flex items-center gap-1 text-xs sm:text-sm">
                                            <Github className="w-4 h-4 text-primary" />
                                            <a 
                                                href={project.repo_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="hover:text-primary transition-colors"
                                            >
                                                Repository
                                            </a>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1 text-xs sm:text-sm">
                                        <ExternalLink className="w-4 h-4 text-primary" />
                                        <a
                                            href={project.project_link || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-primary transition-colors"
                                        >
                                            {project.project_link ? 'Visit Project' : 'No live link'}
                                        </a>
                                    </div>
                                </div>

                                {/* Project Description */}
                                <p className="mt-4 text-muted-foreground text-xs sm:text-sm line-clamp-4 sm:line-clamp-2">
                                    {project.idea_desc}
                                </p>
                            </div>

                            {/* Points Section */}
                            <div className="flex flex-row sm:flex-col items-center gap-2 mt-0 w-full sm:w-auto sm:mt-0 bg-primary/10 rounded-md">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm sm:text-base p-1 font-medium flex items-center gap-1 text-primary">
                                        Points Acquired : {project.rating}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default ContributedTab;