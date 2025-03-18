import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import supabase from "../lib/supabase";
import { 
  Users, 
  Mail,
  MessageSquare,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Slack,
  MessageCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

const CreatorsLab = () => {
  const navigate = useNavigate();
  const { ideaId } = useParams();
  const [loading, setLoading] = useState(true);
  const [idea, setIdea] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("tasks");
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    fetchData();
  }, [ideaId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/');
        return;
      }

      // Fetch idea details and contact info
      const { data: ideaData, error: ideaError } = await supabase
        .from('ideas')
        .select(`
          *,
          profiles:founder_id (
            email
          ),
          manage_team:manage_team (
            whatsapp_link,
            slack_link,
            discord_link
          )
        `)
        .eq('id', ideaId)
        .single();

      if (ideaError) throw ideaError;
      setIdea(ideaData);
      setContactInfo({
        email: ideaData.profiles?.email,
        whatsapp: ideaData.manage_team?.[0]?.whatsapp_link,
        slack: ideaData.manage_team?.[0]?.slack_link,
        discord: ideaData.manage_team?.[0]?.discord_link
      });

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTask = async (taskId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('task_assignments')
        .insert({
          task_id: taskId,
          user_id: session.user.id,
          status: 'in_progress'
        });

      if (error) throw error;
      toast.success('Task assigned successfully');
      fetchData(); // Refresh tasks
    } catch (error) {
      console.error('Error assigning task:', error);
      toast.error('Failed to assign task');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto px-4">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Creators Lab</h1>
            <p className="text-muted-foreground">
              Collaborate on {idea?.title || 'your project'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex space-x-8">
            {['tasks', 'contact'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-1 font-medium text-sm transition-colors ${
                  activeTab === tab 
                    ? 'border-b-2 border-primary text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'tasks' ? (
          <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md border border-border">
            <h2 className="text-xl font-bold mb-6">Available Tasks</h2>
            
            {tasks.length === 0 ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <div className="flex flex-col items-center justify-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-medium text-foreground mb-1">No Tasks Available</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    No tasks have been published yet. Check back later for updates from the team leader.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{task.title}</h3>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          task.priority === "high" && "bg-red-500/20 text-red-500",
                          task.priority === "medium" && "bg-yellow-500/20 text-yellow-500",
                          task.priority === "low" && "bg-green-500/20 text-green-500"
                        )}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssignTask(task.id)}
                      className="ml-4 px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                    >
                      Assign to me
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md border border-border">
            <h2 className="text-xl font-bold mb-6">Contact Information</h2>
            <div className="space-y-4">
              {/* Email */}
              {contactInfo?.email && (
                <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <a href={`mailto:${contactInfo.email}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {contactInfo.email}
                    </a>
                  </div>
                </div>
              )}

              {/* WhatsApp */}
              {contactInfo?.whatsapp && (
                <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">WhatsApp Group</p>
                    <a href={contactInfo.whatsapp} target="_blank" rel="noopener noreferrer" 
                      className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Join WhatsApp Group
                    </a>
                  </div>
                </div>
              )}

              {/* Slack */}
              {contactInfo?.slack && (
                <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <Slack className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Slack Channel</p>
                    <a href={contactInfo.slack} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Join Slack Channel
                    </a>
                  </div>
                </div>
              )}

              {/* Discord */}
              {contactInfo?.discord && (
                <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Discord Server</p>
                    <a href={contactInfo.discord} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Join Discord Server
                    </a>
                  </div>
                </div>
              )}

              {!contactInfo?.email && !contactInfo?.whatsapp && !contactInfo?.slack && !contactInfo?.discord && (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <div className="flex flex-col items-center justify-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium text-foreground mb-1">No Contact Information</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      The team leader hasn't provided any contact information yet.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorsLab;
