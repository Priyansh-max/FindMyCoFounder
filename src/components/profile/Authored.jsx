import React from "react";
import { Clock,Github, PlayCircle, Calendar, ExternalLink, FileCode, Star } from "lucide-react";

const Authored = ({authoredProjects}) => {
    return (
        <div className="space-y-6">
        {authoredProjects.map((project, index) => (
          <div key={project.id} className="border border-border rounded-xl overflow-hidden bg-background hover:border-primary/50 transition-all duration-200">
            <div className="p-6">
              <div className="flex items-start gap-5 bg-red-600">
                {/* Project Logo */}
                <div className="flex-shrink-0 m-1">
                  {project.logo_url ? (
                    <img 
                      src={project.logo_url} 
                      alt={project.title} 
                      className="w-20 h-20 rounded-md object-cover border border-border"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-md bg-primary/10 flex items-center justify-center">
                      <FileCode className="w-8 h-8 text-primary" />
                    </div>
                  )}
                </div>

                {/* Project Information */}
                <div className="flex-1 bg-blue-500">
                  <h3 className="text-xl font-bold text-foreground">{project.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium text-primary">Project Author</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(project.date).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      })} - Present
                    </span>
                  </div>

                  {/* Project Details & Icons Row */}
                  <div className="flex flex-wrap gap-3 mt-3 text-muted-foreground">
                    <div className="flex items-center gap-1 text-sm">
                      <FileCode className="w-4 h-4 text-primary" />
                      {project.project_type || 'Project'}
                    </div>
                    {project.duration && (
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-4 h-4 text-primary" />
                        {project.duration} days
                      </div>
                    )}
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
                  </div>

                  {/* Project Description */}
                  <p className="mt-4 text-muted-foreground text-sm line-clamp-2">
                    {project.idea_desc}
                  </p>
                </div>

                {/* Additional Actions/Stats */}
                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                      Completed
                    </div>
                    <span className="text-sm font-medium flex items-center gap-1 text-primary">
                      +{project.rating} <Star className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  
                  <a
                    href={project.project_link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-2 flex items-center gap-1 text-sm ${
                      project.project_link ? 'text-primary hover:text-primary/90' : 'text-muted-foreground cursor-default'
                    }`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    {project.project_link ? 'Visit Project' : 'No live link'}
                  </a>
                </div>
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