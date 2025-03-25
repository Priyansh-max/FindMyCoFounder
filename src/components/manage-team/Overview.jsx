import { useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Users, UserPlus, Github, MessageSquare } from 'lucide-react';
// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Overview = ({session, repostats, team , dailyCommitData }) => {
    const chartRef = useRef(null);

    // Format the last updated time if available
    const formattedLastUpdate = repostats?.lastUpdated 
      ? new Date(repostats.lastUpdated).toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        }) 
      : null;

    // UI Components
    const Card = ({ title, value, description, icon }) => (
        <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">{title}</h3>
            {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        </div>
    );


    const RecentMembersList = ({ members }) => (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Team Members</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Showing {Math.min(5, members.length)} of {members.length} team members.
          </p>
    
          <div className="space-y-4 mt-6">
            {members.length > 0 ? (
              members.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {member.avatar_url ? (
                        <img 
                          src={member.avatar_url} 
                          alt={member.full_name} 
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.full_name || 'Team Member'}</p>
                      <p className="text-xs text-muted-foreground">{member.email || 'No email provided'}</p>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {new Date(member.joined_at).toLocaleDateString('en-US', { 
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No team members yet.</p>
            )}
          </div>
        </div>
    );

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: 'rgb(156, 163, 175)', // text-muted-foreground equivalent
              font: {
                size: 12,
                weight: 'medium'
              },
              boxWidth: 15,
              padding: 15
            }
          },
          title: {
            display: false,
            text: 'Daily Commits (Last 7 Days)',
            color: 'rgb(17, 24, 39)', // text-foreground equivalent
            font: {
              size: 18,
              weight: 'bold',
            },
            padding: {
              top: 10,
              bottom: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgb(31, 41, 55)', // bg-card equivalent
            titleColor: 'rgb(243, 244, 246)', // text-card-foreground equivalent
            bodyColor: 'rgb(243, 244, 246)', // text-card-foreground equivalent
            borderColor: 'rgb(75, 85, 99)', // border-border equivalent
            borderWidth: 1,
            padding: 8,
            cornerRadius: 6,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return `Total Commits: ${context.raw}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(156, 163, 175, 0.1)', // text-muted-foreground with opacity
            },
            ticks: {
              color: 'rgb(156, 163, 175)', // text-muted-foreground equivalent
              font: {
                size: 12,
              },
              padding: 2
            },
            title: {
              display: true,
              color: 'rgb(156, 163, 175)', // text-muted-foreground equivalent
              font: {
                size: 13,
                weight: 'medium'
              },
              padding: {
                bottom: 10
              }
            }
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: 'rgb(156, 163, 175)', // text-muted-foreground equivalent
              font: {
                size: 12,
              },
              padding: 8
            }
          }
        },
        barThickness: 50,
        maxBarThickness: 100,
        barPercentage: 0.8,
        categoryPercentage: 0.8
    };

    return (
    <div className="space-y-6">
        {formattedLastUpdate && (
            <div className="text-xs text-muted-foreground flex items-center">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${repostats?.isCached ?'bg-yellow-400' : 'bg-green-400'}`}></span>
              <span>Data updates every 1 hour</span>
              {repostats?.isCached && (
                <span className="ml-1 text-xs italic">(currently you are viewing cached data)</span>
              )}
            </div>
        )}
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          title="Team Members" 
          value={team.member_profiles.length} 
          description="Active contributors" 
          icon={<Users className="h-4 w-4 text-muted-foreground" />} 
        />
        {!team.repo_name ? (
          <>
            <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm flex flex-col items-center justify-center">
              <Github className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground text-center">Connect a repository to view commit statistics</p>
            </div>
            <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm flex flex-col items-center justify-center">
              <Github className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground text-center">Connect a repository to view issue statistics</p>
            </div>
            <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm flex flex-col items-center justify-center">
              <Github className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground text-center">Connect a repository to view PR statistics</p>
            </div>
          </>
        ) : (
          <>
            <Card 
              title="Total Commits" 
              value={repostats?.commitCount || 0} 
              description="Commits till now" 
              icon={<UserPlus className="h-4 w-4 text-muted-foreground" />} 
            />
            <Card 
              title="Total Issues" 
              value={repostats?.issueCount || 0} 
              description="Open and fixed issues" 
              icon={<Github className="h-4 w-4 text-muted-foreground" />} 
            />
            <Card 
              title="Total Pull Requests" 
              value={repostats?.pullCount || 0} 
              description="Open and Closed PRs" 
              icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />} 
            />
          </>
        )}
      </div>
      
      {/* Charts and Recent Members - Side by Side */}
      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4 bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Commit History</h3>

          </div>
          {!team.repo_name ? (
            <div className="h-80 flex flex-col items-center justify-center">
              <Github className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground text-center mb-2">No Repository Connected</p>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Connect a GitHub repository to view commit history and other statistics
              </p>
            </div>
          ) : (
            <div className="h-80">
              <Bar options={chartOptions} data={dailyCommitData} ref={chartRef} />
            </div>
          )}
        </div>
        
        <div className="md:col-span-3 bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
          <RecentMembersList members={team.member_profiles} />
        </div>
      </div>
    </div>
  );
}

export default Overview;