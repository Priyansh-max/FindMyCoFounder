import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Video, AlertTriangle, Github, Users, GitPullRequest, GitMerge, Calendar, Clock, Info, GitCommitIcon, CircleDot, Flag, Shield } from 'lucide-react';
import supabase from '../lib/supabase';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const Admin = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState({});
  const [spamMembers, setSpamMembers] = useState({});
  const [session, setSession] = useState(null);

  // Checklist items
  const checklistItems = [
    "Does it a provide a relevant logo",
    "Does github contains a README.md file",
    "Does it has an open issue or open pull request",
    "Does it provide a video demo",
    "Does it provide a relevant description",
    "Mark SPAM"
  ];

  useEffect(() => {
    const fetchSessionAndData = async () => {
      try {
        // First get the session
        const {data: {session}} = await supabase.auth.getSession();
        if (!session) {
          toast.error('Authentication required');
          // Assuming navigate is imported from react-router-dom
          // navigate('/');
          return;
        }
        setSession(session);
        
        // Now fetch submissions with the session
        await fetchSubmissions(session);
      } catch (error) {
        console.error('Error initializing data:', error);
        toast.error('Failed to initialize data');
      }
    };
    
    fetchSessionAndData();
  }, []);

  const fetchSubmissions = async (currentSession) => {
    try {
      setLoading(true);
      
      // Use the session passed as parameter or fall back to the state
      const sessionToUse = currentSession || session;
      
      if (!sessionToUse) {
        toast.error('No active session');
        return;
      }
      
      const submissionsResponse = await axios.get('https://findmycofounder.onrender.com/api/admin/submissions', {
        headers: {
          Authorization: `Bearer ${sessionToUse.access_token}`
        }
      });

      if(!submissionsResponse.data.success){
        toast.error(submissionsResponse.data.error);
        return;
      }

      const data = submissionsResponse.data.data;
      const initialChecklist = {};
      const initialSpamMembers = {};
        
      data.forEach(submission => {
        initialChecklist[submission.id] = new Array(checklistItems.length).fill(false);
        
        // Initialize spam tracking for each member in each submission
        initialSpamMembers[submission.id] = {};
        if (submission.mem_stats && Array.isArray(submission.mem_stats)) {
          submission.mem_stats.forEach((member, index) => {
            initialSpamMembers[submission.id][index] = false;
          });
        }
      });
      
      setChecklist(initialChecklist);
      setSpamMembers(initialSpamMembers);
      setSubmissions(data);

      console.log(data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistChange = (submissionId, index) => {
    setChecklist(prev => ({
      ...prev,
      [submissionId]: prev[submissionId].map((item, i) => i === index ? !item : item)
    }));
  };

  const handleToggleSpamMember = (submissionId, memberIndex) => {
    setSpamMembers(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [memberIndex]: !prev[submissionId][memberIndex]
      }
    }));
    
    const memberName = submissions.find(s => s.id === submissionId)?.mem_stats[memberIndex]?.full_name || 'Team member';
    const isSpam = !spamMembers[submissionId]?.[memberIndex];
    
    if (isSpam) {
      toast.success(`${memberName} marked as spam contributor`);
    } else {
      toast.success(`${memberName} unmarked as spam contributor`);
    }
  };

  const handleApprove = async (submissionId) => {
    try {
      // Get the submission by ID
      const submission = submissions.find(s => s.id === submissionId);
      
      if (!submission) {
        throw new Error('Submission not found');
      }
      
      // 1. Create project details object
      const projectDetails = {
        idea_id: submission.idea_id,
        description: submission.description,
        logo_url: submission.logo_url,
        project_link: submission.project_link,
        repo_url: submission.repo_url,
        repo_stats: submission.repo_stats,
        start_date: submission.start_date,
        repo_name: submission.repo_name,
        video_url: submission.video_url
      };
      
      // 2. Create member stats object with spam flags
      const memberStatsWithSpam = submission.mem_stats.map((member, index) => {
        return {
          ...member,
          is_spam: spamMembers[submissionId]?.[index] || false
        };
      });
      
      // 3. Create checklist object with only checked items
      const checkedItems = {};
      if (checklist[submissionId]) {
        checklist[submissionId].forEach((isChecked, index) => {
          if (isChecked) {
            checkedItems[checklistItems[index]] = true;
          }
        });
      }
      
      // Log all three objects
      console.log("Project Details:", projectDetails);
      console.log("Member Stats with Spam Flags:", memberStatsWithSpam);
      console.log("Checked Checklist Items:", checkedItems);

      const response = await axios.put(`https://findmycofounder.onrender.com/api/admin/submissions/${submissionId}`, {
        projectDetails,
        mem_details: memberStatsWithSpam,
        checklist: checkedItems
      },{
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if(!response.data.success){
        toast.error(response.data.error);
        return;
      }
      
      toast.success('Project approved successfully');
      
    } catch (error) {
      console.error('Error approving submission:', error);
      toast.error('Failed to approve project');
    }
  };

  const handleRequestChanges = async (submissionId) => {
    try {
      const { data, error } = await supabase
        .from('projectSubmission')
        .update({ status: 'changes_requested' })
        .eq('id', submissionId);

      if (error) throw error;
      toast.success('Changes requested successfully');
      
      // Update local state
      setSubmissions(prev => 
        prev.map(sub => sub.id === submissionId ? { ...sub, status: 'changes_requested' } : sub)
      );
    } catch (error) {
      console.error('Error requesting changes:', error);
      toast.error('Failed to request changes');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Project Submissions</h1>

      <div className="grid gap-6">
        {submissions.map((submission) => (
          <div key={submission.id} className="bg-card border border-border rounded-lg p-6 space-y-6">
            {/* Header Section */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src={submission.logo_url} 
                  alt="Project Logo" 
                  className="w-16 h-16 rounded-lg object-cover border border-border"
                />
                <div>
                  <h2 className="text-xl font-semibold">{submission.repo_name}</h2>
                  <a 
                    href={submission.project_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Info className="w-4 h-4" />
                    View Project
                  </a>
                  <a 
                    href={submission.repo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Github className="w-4 h-4" />
                    View Repository
                  </a>
                  {/* if submission contains a live demo link only display this */}
                  {submission.video_url && (
                    <a 
                    href={submission.video_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                    <Video className="w-4 h-4" />
                    View Live Demo
                    </a>

                  )}
                  
                </div>
                
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(submission.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleRequestChanges(submission.id)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Request Changes
                </button>
              </div>
            </div>

            {/* Project Details Section */}
            <div className="space-y-6">
              {/* Repository Stats */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Github className="w-5 h-5" />
                  Repository Statistics
                </h3>
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <GitCommitIcon className="w-4 h-4 text-primary" />
                      <span className="text-sm">Commits: {submission.repo_stats.commitCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CircleDot className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Issues: {submission.repo_stats.issueCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GitPullRequest className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">PRs: {submission.repo_stats.pullCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Started: {new Date(submission.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Stats */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Members
                </h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-muted-foreground">
                        Showing {submission.mem_stats.length} members
                      </span>
                      {Object.values(spamMembers[submission.id] || {}).some(isSpam => isSpam) && (
                        <div className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded flex items-center gap-1">
                          <Flag className="w-3 h-3" />
                          {Object.values(spamMembers[submission.id] || {}).filter(isSpam => isSpam).length} spam contributors marked
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 modern-scrollbar">
                      {submission.mem_stats.map((member, index) => (
                        <div key={index} className={`bg-background rounded-lg p-3 border transition-colors ${
                          spamMembers[submission.id]?.[index] 
                            ? 'border-destructive border-dashed' 
                            : 'border-border hover:border-primary/50'
                        }`}>
                          <div className="flex items-center gap-4">
                            {/* Avatar and Identity */}
                            <div className="flex items-center gap-3 w-64">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                member.avatar_url ? 'bg-primary/10' : 'bg-destructive/10'
                              }`}>
                                {member.avatar_url ? (
                                  <img src={member.avatar_url} alt="Member Avatar" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  <Users className="w-5 h-5 text-primary" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {member.full_name}
                                  {spamMembers[submission.id]?.[index] && (
                                    <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">SPAM</span>
                                  )}
                                </div>
                                <a 
                                  href={`https://github.com/${member.github_username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                  <Github className="w-3 h-3" />
                                  {member.github_username}
                                </a>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-6 flex-1">
                              <div className="flex items-center gap-1">
                                <GitCommitIcon className="w-4 h-4 text-primary" />
                                <span className="text-sm">{member.commits}</span>
                              </div>

                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-2 text-sm">
                                <CircleDot className="w-4 h-4 text-blue-500" />
                                  <span className="text-green-500">{member.open_pull_requests}</span>
                                  /
                                  <span className="text-orange-500">{member.closed_pull_requests}</span>
                                </div>
                              </div>

                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-2 text-sm">
                                <GitPullRequest className="w-4 h-4 text-blue-500" />
                                  <span className="text-green-500">{member.open_issues}</span>
                                  /
                                  <span className="text-orange-500">{member.closed_issues}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <GitMerge className="w-4 h-4 text-blue-500" />
                                <span className="text-sm">{member.merged_pull_requests}</span>
                              </div>

                              <div className={`px-2 py-1 rounded-full text-xs ${
                                member.inactive_days > 0 
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              }`}>
                                Inactive for {member.inactive_days}d
                              </div>

                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-blue-500" />
                                <span className="text-sm"> {new Date(member.joined_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </div>

                              {/* Mark as Spam Button */}
                              <button
                                onClick={() => handleToggleSpamMember(submission.id, index)}
                                className={`ml-auto px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                                  spamMembers[submission.id]?.[index]
                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                                }`}
                              >
                                {spamMembers[submission.id]?.[index] ? (
                                  <>
                                    <Shield className="w-3 h-3" />
                                    Unmark Spam
                                  </>
                                ) : (
                                  <>
                                    <Flag className="w-3 h-3" />
                                    Mark as Spam
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist Section */}
            <div className="border-t border-border pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-4">Review Checklist</h3>
              <div className="grid grid-cols-2 gap-4">
                {checklistItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checklist[submission.id]?.[index] || false}
                      onChange={() => handleChecklistChange(submission.id, index)}
                      className="rounded border-primary text-primary focus:ring-primary"
                    />
                    <label className="text-sm">{item}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Description Section */}
            <div className="border-t border-border pt-4">
              <h3 className="text-lg font-semibold mb-2">Project Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {submission.description}
              </p>
            </div>

            {/* Video Demo Section */}
            {submission.video_link && (
              <div className="border-t border-border pt-4">
                <h3 className="text-lg font-semibold mb-2">Video Demonstration</h3>
                <a 
                  href={submission.video_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm flex items-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  Watch Demo
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;
