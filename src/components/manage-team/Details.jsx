import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Details = ({ session, ideaId, team }) => {
    const [loading, setLoading] = useState(false);

    const handleRemoveMember = (memberId, memberName) => {
        // In real implementation, this would make an API call
        toast.success(`Removed ${memberName} from the team`);
    };

    const generateDetailsMockData = () => {
        return [
          {
            id: 1,
            full_name: "Sarah Chen",
            email: "sarah.chen@example.com",
            avatar_url: "https://ui-avatars.com/api/?name=Sarah+Chen&background=random",
            stats: {
              totalCommits: 342,
              lastCommit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
              openIssues: 15,
              closedIssues: 28,
              openPRs: 3,
              closedPRs: 12,
              mergedPRs: 25
            },
            joined_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
          },
          {
            id: 2,
            full_name: "James Wilson",
            email: "james.wilson@example.com",
            avatar_url: "https://ui-avatars.com/api/?name=James+Wilson&background=random",
            stats: {
              totalCommits: 289,
              lastCommit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
              openIssues: 8,
              closedIssues: 19,
              openPRs: 2,
              closedPRs: 8,
              mergedPRs: 18
            },
            joined_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) // 45 days ago
          },
          {
            id: 3,
            full_name: "Emily Rodriguez",
            email: "emily.r@example.com",
            avatar_url: "https://ui-avatars.com/api/?name=Emily+Rodriguez&background=random",
            stats: {
              totalCommits: 421,
              lastCommit: new Date(), // today
              openIssues: 12,
              closedIssues: 35,
              openPRs: 5,
              closedPRs: 15,
              mergedPRs: 32
            },
            joined_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          },
          {
            id: 4,
            full_name: "Michael Park",
            email: "michael.park@example.com",
            avatar_url: "https://ui-avatars.com/api/?name=Michael+Park&background=random",
            stats: {
              totalCommits: 156,
              lastCommit: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
              openIssues: 5,
              closedIssues: 12,
              openPRs: 1,
              closedPRs: 6,
              mergedPRs: 10
            },
            joined_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
          }
        ];
    };

    const mockTeamData = generateDetailsMockData();

    return (
        <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Team Members</h2>
            <div className="text-sm text-muted-foreground">
              Total Members: {mockTeamData.length}
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
                {mockTeamData.map((member) => (
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
                      {member.joined_at.toLocaleDateString('en-US', { 
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {member.stats.lastCommit.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium">{member.stats.totalCommits}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-8">
                        <span className="text-green-500">{member.stats.openIssues}</span>
                        <span className="text-red-500">{member.stats.closedIssues}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-8">
                        <span className="text-yellow-500">{member.stats.openPRs}</span>
                        <span className="text-red-500">{member.stats.closedPRs}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-green-500 font-medium">{member.stats.mergedPRs}</span>
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

            {mockTeamData.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No team members found.</p>
              </div>
            )}
          </div>
        </div>
    );
}

export default Details;