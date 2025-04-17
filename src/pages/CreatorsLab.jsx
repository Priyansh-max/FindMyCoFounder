import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import supabase from "../lib/supabase";
import { FaWhatsapp } from "react-icons/fa";
import { FaDiscord } from "react-icons/fa";
import slack from "../assets/slack.png";
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
  Github,
  ExternalLink,
  GitBranch,
  GitPullRequest,
  GitCommit,
  AlertCircle,
  BookOpen,
  Star,
  Trophy,
  Info,
  X,
  RefreshCw
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import axios from "axios";

const CreatorsLab = () => {
  const navigate = useNavigate();
  const { ideaId } = useParams();
  const [loading, setLoading] = useState(true);
  const [idea, setIdea] = useState(null);
  const [team, setTeam] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const [memberStats, setMemberStats] = useState({});
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    fetchData();
  }, [ideaId]);

  const apiUrl = import.meta.env.VITE_BACKEND_URL;

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
            whatsapp_url,
            slack_url,
            discord_url,
            repo_name,
            repo_owner,
            repo_url
          )
        `)
        .eq('id', ideaId)
        .single();

      if (ideaError) throw ideaError;
      setIdea(ideaData);
      setContactInfo({
        email: ideaData.profiles?.email,
        whatsapp: ideaData.manage_team?.[0]?.whatsapp_url ,
        slack: ideaData.manage_team?.[0]?.slack_url,
        discord: ideaData.manage_team?.[0]?.discord_url,
        repo_name: ideaData.manage_team?.[0]?.repo_name,
        repo_url: ideaData.manage_team?.[0]?.repo_url
      });

      // Fetch team data
      const response = await axios.get(`${apiUrl}/api/manage-team/get-team/${ideaId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.data.success) {
        throw new Error('Failed to fetch team data');
      }

      const teamData = response.data.data;
      setTeam(teamData);

      // Fetch member stats if repo is connected
      if (teamData.repo_name) {
        await getMemberStats(session, teamData);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getMemberStats = async (session, team) => {
    if (!team || !session) return;

    const username = team.repo_owner;
    const repoName = team.repo_name;

    if (!username || !repoName) return;

    const memberProfiles = team.member_profiles;
    if (!memberProfiles || !Array.isArray(memberProfiles)) return;

    try {
      const timestamp = Date.now();
      const requestConfig = {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('provider_token')}`
        },
        params: {
          t: timestamp,
          updatedDate: team.updated_at,
          cache: 'true',
          from: 'creatorsLab'
        }
      };

      const updatedProfiles = await Promise.all(memberProfiles.map(async (member) => {
        try {
          const github_username = member.github_username;
          if (!github_username) return member;

          const response = await axios.get(
            `${apiUrl}/api/github/member-stats/${username}/${repoName}/${github_username}/${member.joined_at}`,
            requestConfig
          );

          if (!response.data.success) {
            throw new Error(`Failed to fetch stats for ${github_username}`);
          }
          console.log("response.data.data:", response.data.data);

          // Update last updated time and cache status
          setLastUpdated(response.data.data.lastUpdated);
          setIsCached(response.data.data.isCached);

          return {
            ...member,
            stats: {
              ...response.data.data,
            }
          };
        } catch (memberError) {
          console.error(`Error fetching stats for ${member.github_username}:`, memberError);
          return member;
        }
      }));

      // Sort members by total contributions
      const sortedMembers = updatedProfiles.sort((a, b) => {
        const aTotal = (a.stats?.commits || 0) + (a.stats?.merged_prs || 0) + (a.stats?.closed_issues || 0);
        const bTotal = (b.stats?.commits || 0) + (b.stats?.merged_prs || 0) + (b.stats?.closed_issues || 0);
        return bTotal - aTotal;
      });

      setMemberStats(sortedMembers);

      console.log("sortedMembers:", sortedMembers);

    } catch (error) {
      console.error('Error in getMemberStats:', error);
      toast.error('Failed to fetch member statistics');
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
    <div className="max-w-8xl mx-auto px-4 py-8">
      <div className="flex flex-col space-y-8">
        {/* Header with Repo Info and Communication Links */}
        <div className="bg-card text-card-foreground py-4 border-b border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Creators Lab</h1>
              <p className="text-muted-foreground mt-1">
                Collaborate on {idea?.title || 'your project'}
              </p>
            </div>
            {contactInfo?.repo_name && (
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <div className="absolute -inset-[1px] rounded-md bg-gradient-to-r from-primary via-purple-500 to-primary opacity-75 blur-[2px] group-hover:opacity-100 transition-all duration-300 animate-border-glow"></div>
                  <div className="relative flex items-center space-x-2 px-4 py-2 bg-background rounded-md border border-transparent">
                    <Github className="w-5 h-5" />
                    <a 
                      href={contactInfo.repo_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-foreground hover:text-primary transition-colors"
                    >
                      {contactInfo.repo_name}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:justify-between gap-4 mt-3 pt-3 border-t border-border">
            {/* Communication Links */}
            <div className="flex items-center flex-wrap gap-4">
              {contactInfo?.email && (
                <a 
                  href={`mailto:${contactInfo.email}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4 text-primary" />
                  <span>Email</span>
                </a>
              )}

              {contactInfo?.whatsapp !== 'not set' && (
                <a 
                  href={contactInfo.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-green-500 transition-colors"  
                >
                  <FaWhatsapp className="w-4 h-4 text-green-500" />
                  <span>WhatsApp</span>
                </a>
              )}

              {contactInfo?.slack !== 'not set' && (
                <a 
                  href={contactInfo.slack}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <img src={slack} alt="slack" className="w-4 h-4" />
                  <span>Slack</span>
                </a>
              )}

              {contactInfo?.discord !== 'not set' && (
                <a 
                  href={contactInfo.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-indigo-500 transition-colors"
                >
                  <FaDiscord className="w-4 h-4 text-indigo-500" />
                  <span>Discord</span>
                </a>
              )}
            </div>
            
            {/* Guidelines Toggle Button */}
            <button
              onClick={() => setShowGuidelines(!showGuidelines)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-muted transition-colors"
            >
              <BookOpen className="w-4 h-4 text-primary" />
              <span>{showGuidelines ? 'Hide' : 'Display'} Contribution Guidelines</span>
            </button>
          </div>

          {/* Contribution Guidelines - Shown conditionally */}
          {showGuidelines && (
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="text-base font-semibold mb-4">Contribution Guidelines</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <GitBranch className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium">Branch Naming</h4>
                    <p className="text-xs text-muted-foreground">
                      Use descriptive branch names following the pattern: feature/description or fix/description
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <GitCommit className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium">Commit Messages</h4>
                    <p className="text-xs text-muted-foreground">
                      Write clear, descriptive commit messages that explain what changes were made and why
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <GitPullRequest className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium">Pull Requests</h4>
                    <p className="text-xs text-muted-foreground">
                      Create PRs for all changes. Include a description, screenshots if applicable, and tag team members
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium">Issues</h4>
                    <p className="text-xs text-muted-foreground">
                      Create issues for bugs, feature requests, or improvements. Use appropriate labels and assign to members
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cache Status and Last Updated */}
        <div className="flex mx-1 items-center justify-between mb-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              {isCached && (
                <div className="flex items-center space-x-1">
                  <RefreshCw className="w-4 h-4 text-primary" />
                  <span>Ranking and stats are refreshed every hour</span>
                </div>
              )}
            </div>
            {lastUpdated && (
              <div className="flex items-center space-x-1">
                <span className={`inline-block w-2 h-2 rounded-full animate-pulse mr-2 ${isCached ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
                <span>
                  Last updated: {new Date(lastUpdated).toLocaleTimeString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
        </div>

        {/* Team Members Section */}
        <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Team Members</h2>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-muted-foreground">
                Total Members: {memberStats.length || 0}
              </div>
            </div>
          </div>

          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Rank</th>
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium text-center">Commits</th>
                  <th className="px-4 py-3 font-medium text-center">Merged PRs</th>
                  <th className="px-4 py-3 font-medium text-center">Closed Issues</th>
                  <th className="px-4 py-3 font-medium text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {memberStats.map((member, index) => (
                  <tr key={member.id || member.email} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        {index === 0 ? (
                          <Trophy className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <span className="text-muted-foreground">#{index + 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {member.avatar_url ? (
                            <img 
                              src={member.avatar_url}
                              alt={member.full_name}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{member.full_name || 'Unknown'}</div>
                          <div className="text-xs text-primary">{member.github_username || 'No GitHub username'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {member.joined_at ? new Date(member.joined_at).toLocaleDateString('en-US', { 
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium">{member.stats?.commits || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-green-500 font-medium">{member.stats?.merged_prs || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-blue-500 font-medium">{member.stats?.closed_issues || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold">
                        {(member.stats?.commits || 0) + (member.stats?.merged_prs || 0) + (member.stats?.closed_issues || 0)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorsLab;
