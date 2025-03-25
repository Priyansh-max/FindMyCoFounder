import { useState } from 'react';
import { Loader2, Trash2, Users, ArrowRight, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Details = ({ team }) => {
    const [loading, setLoading] = useState(false);
    console.log(team);
    const handleRemoveMember = (memberId, memberName) => {
        // In real implementation, this would make an API call
        toast.success(`Removed ${memberName} from the team`);
    };


    // If no team members, show empty state
    if (!team.member_profiles || team.member_profiles.length === 0) {
        return (
            <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="relative mb-6">
                        {/* Animated background glow */}
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse"></div>
                        {/* Icon */}
                        <div className="relative bg-primary/10 p-4 rounded-full">
                            <Users className="w-12 h-12 text-primary" />
                        </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Team Members Yet</h3>
                    <p className="text-muted-foreground max-w-sm mb-6">
                        Start building your team by accepting applications or inviting collaborators to join your project.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Team Members</h2>
            <div className="text-sm text-muted-foreground">
              Total Members: {team.member_profiles.length}
            </div>
          </div>

          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Last Commit</th>
                  <th className="px-4 py-3 font-medium text-center">Commits</th>
                  <th className="px-4 py-3 font-medium text-center">
                    Issues
                    <div className="flex justify-center gap-4 mt-1 text-[10px] text-muted-foreground">
                      <span>OPEN</span>
                      <span>CLOSED</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 font-medium text-center">
                    Pull Requests
                    <div className="flex justify-center gap-4 mt-1 text-[10px] text-muted-foreground">
                      <span>OPEN</span>
                      <span>CLOSED</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 font-medium text-center">
                    Merged PRs
                  </th>
                  <th className="px-4 py-3 font-medium text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {team.member_profiles.map((member) => (
                  <tr key={member.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <img 
                            src={member.avatar_url}
                            alt={member.full_name}
                            className="h-8 w-8 rounded-full"
                          />
                        </div>
                        <div>
                          <div className="font-medium">{member.full_name}</div>
                          <div className="text-xs text-muted-foreground">{member.email}</div>
  
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(member.joined_at).toLocaleDateString('en-US', { 
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {member.stats?.last_commit ? new Date(member.stats.last_commit).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'No commits yet'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium">{member.stats?.commits || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-8">
                        <span className="text-green-500">{member.stats?.open_issues || 0}</span>
                        <span className="text-red-500">{member.stats?.closed_issues || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-8">
                        <span className="text-yellow-500">{member.stats?.open_prs || 0}</span>
                        <span className="text-red-500">{member.stats?.closed_prs || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-green-500 font-medium">{member.stats?.merged_prs || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRemoveMember(member.id, member.full_name)}
                        className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-full transition-colors"
                        title={`Remove ${member.full_name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    );
}

export default Details;