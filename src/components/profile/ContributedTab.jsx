import React from "react";
import { Users,  Clock, Github, PlayCircle, Calendar, ExternalLink, FileCode, } from "lucide-react";

const ContributedTab = ({contributedProjects}) => {
    return (
        <div className="space-y-6">
            {contributedProjects.map((project, index) => (
                  <div key={index} className="border border-border rounded-lg p-5 hover:border-primary/50 transition-colors group">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                          {project.logo_url ? (
                            <img 
                              src={project.logo_url} 
                              alt={project.title} 
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <FileCode className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-foreground">{project.title}</h3>
                          <span className="text-sm px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                            Approved
                          </span>
                        </div>
                        
                        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                          {project.idea_desc}
                        </p>
                        
                        <div className="mt-4 flex items-center text-sm text-muted-foreground">
                          <div className="flex items-center mr-4">
                            <Calendar className="w-4 h-4 mr-1" /> 
                            {new Date(project.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="flex items-center mr-4">
                            <Clock className="w-4 h-4 mr-1" />
                            {project.duration} days
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {project.project_type === 'team' ? 'Team Project' : 'Solo Project'}
                          </div>
                        </div>
                        
                        <div className="mt-4 flex items-center gap-3">
                          {project.repo_url && (
                            <a 
                              href={project.repo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20 transition-colors"
                            >
                              <Github className="w-3 h-3 mr-1" /> Repository
                            </a>
                          )}
                          {project.project_link && (
                            <a 
                              href={project.project_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" /> Live Demo
                            </a>
                          )}
                          {project.video_url && (
                            <a 
                              href={project.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs font-medium text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-3 py-1 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            >
                              <PlayCircle className="w-3 h-3 mr-1" /> Video Demo
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-foreground">{project.rating} points</div>
                        <div className="text-sm text-blue-500 font-medium">Contributor</div>
                      </div>
                    </div>
                  </div>
                ))}
        </div>
    )

}

export default ContributedTab;