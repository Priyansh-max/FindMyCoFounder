import React from "react";
import { Clock,Github, PlayCircle, Calendar, ExternalLink, FileCode, Check } from "lucide-react";

const Authored = ({authoredProjects}) => {
    return (
        <div className="space-y-6">
        {authoredProjects.map((project, index) => (
          <div key={project.id} className="border border-border rounded-xl overflow-hidden bg-background hover:border-primary/50 transition-all duration-200">
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
                  <h3 className="text-sm sm:text-lg font-bold text-foreground">{project.title}</h3>
                  {/* Project Details & Icons Row */}


                  <div className="flex flex-wrap gap-3 mt-2 text-muted-foreground">
                    <div className="flex items-center gap-1 text-xs sm:text-sm">
                      <FileCode className="w-4 h-4 text-primary" />
                      {project.project_type.charAt(0).toUpperCase() + project.project_type.slice(1) || 'Project'}
                    </div>
                    {project.repo_url && (
                      <div className="flex items-center gap-1 text-sm">
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
                    {project.duration && (
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-4 h-4 text-primary" />
                        {project.duration} days
                      </div>
                    )}
                    {project.created_at && (
                      <div className="flex items-center gap-1 text-xs sm:text-sm">
                        <Calendar className="w-4 h-4 text-primary" />
                        {new Date(project.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    )}
                    {/* show the date when the project was completed */}
                    {project.date && (
                      <div className="flex items-center gap-1 text-xs sm:text-sm">
                        <Check className="w-4 h-4 text-primary" />
                        {new Date(project.date).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    )}
                  </div>
                  {/* show only top skills used in the project like the first 5 will do... */}
                  {project.dev_req && (
                    <div className="flex flex-wrap gap-3 mt-2 mb-1 text-muted-foreground">
                      {/* add a top skills tag */}
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">Top skills : </span>
                      {project.dev_req.split(',').slice(0, 6).map((skill, index) => (
                        <span 
                          key={index} 
                          className="inline-flex items-center px-2 rounded-full text-xs sm:text-sm bg-primary/10 text-primary"
                        >
                          {skill.trim()}
                        </span>
                        
                      ))}
                    </div>
                  )}

                </div>

                <div className="flex flex-row sm:flex-col items-center gap-2 mt-0 w-full sm:w-auto sm:mt-0 bg-primary/10 rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base p-1 font-medium flex items-center gap-1 text-primary">
                      Points Acquired : {project.rating}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                {/* Project Description */}
                <p className="mt-4 text-muted-foreground text-xs sm:text-sm line-clamp-4 sm:line-clamp-2">
                  {project.idea_desc}
                </p>
              </div>
              {/* Project Video Preview - Optional */}
              {project.video_url && (
                <div className="mt-5 border-t border-border pt-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-primary" />
                    Project Demo
                  </h4>
                  <div className="relative aspect-video rounded-md overflow-hidden">
                    <iframe
                      src={project.video_url}
                      title={`${project.title} demo video`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      className="w-full h-full border-0"
                    ></iframe>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )

}

export default Authored;