import { useState, useRef, useEffect } from 'react';
import { Upload, Video, Text, Image, Info, FileText, AlertCircle, Loader2, CheckCircle, Link as LinkIcon, CheckCircle2, XCircle, Github } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';

const Submit = ({ session, ideaId, team: initialTeam, repostats: initialRepostats }) => {
  // Form state
  const [projectLink, setProjectLink] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [documentLink, setDocumentLink] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [error, setError] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const fileInputRef = useRef(null);
  const [fieldStatus, setFieldStatus] = useState({
    projectLink: { loading: false, valid: null },
    videoLink: { loading: false, valid: null },
    description: { loading: false, valid: null }
  });
  const [team, setTeam] = useState(initialTeam);
  const [repostats, setRepostats] = useState(initialRepostats);
  const [isFetchingFreshData, setIsFetchingFreshData] = useState(false);
  const [showSubmissionPreview, setShowSubmissionPreview] = useState(false);
  const [currentSubmissionStep, setCurrentSubmissionStep] = useState('');

  // Update state when props change
  useEffect(() => {
    setTeam(initialTeam);
    setRepostats(initialRepostats);
  }, [initialTeam, initialRepostats]);

  // Fetch fresh non-cached data before submission
  const fetchFreshData = async () => {
    if (!session || !team) {
      console.error("Missing session or team data");
      return false;
    }

    try {
      setIsFetchingFreshData(true);
      const username = session.user.user_metadata.user_name;
      
      if (!username || !team.repo_name) {
        console.error("Missing username or repository name");
        return false;
      }
      
      // Add timestamp to bust cache and set headers
      const timestamp = Date.now();
      const requestConfig = {
        headers: {
          'Authorization': `Bearer ${session.provider_token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: {
          cache: 'false',
          t: timestamp,
          disableCache: 'true' // Explicitly disable caching on the server side
        }
      };
      
      // Fetch fresh repo stats with cache-busting parameter
      const repoStatsResponse = await axios.get(
        `http://localhost:5000/api/github/repo-stats/${username}/${team.repo_name}/${team.updated_at}`,
        requestConfig
      );
      
      if (!repoStatsResponse.data.success) {
        throw new Error('Failed to fetch fresh repository statistics');
      }
      
      // Log the response to verify data is fresh
      console.log("Fresh repo stats received:", {
        fromCache: repoStatsResponse.data.data.fromCache || false,
        lastUpdated: repoStatsResponse.data.data.lastUpdated,
        commitCount: repoStatsResponse.data.data.commitCount
      });
      
      // Update repo stats
      const freshRepoStats = {
        commitCount: repoStatsResponse.data.data.commitCount,
        issueCount: repoStatsResponse.data.data.issueCount,
        pullCount: repoStatsResponse.data.data.pullCount,
        dailyCommits: repoStatsResponse.data.data.dailyCommits,
        lastUpdated: repoStatsResponse.data.data.lastUpdated,
        isCached: false
      };
      setRepostats(freshRepoStats);
      
      // Fetch fresh member stats for each team member
      const memberProfiles = team.member_profiles;
      if (!memberProfiles || !Array.isArray(memberProfiles)) {
        console.error('No member profiles found or invalid data');
        return false;
      }
      
      const updatedProfiles = await Promise.all(memberProfiles.map(async (member) => {
        try {
          const github_username = member.github_username;
          if (!github_username) {
            console.warn(`GitHub username not found for member: ${member.full_name}`);
            return member;
          }
          
          // Fetch fresh member statistics with cache-busting parameter
          const response = await axios.get(
            `http://localhost:5000/api/github/member-stats/${username}/${team.repo_name}/${github_username}/${team.updated_at}`,
            requestConfig
          );
          
          if (!response.data.success) {
            throw new Error(`Failed to fetch stats for ${github_username}`);
          }
          
          // Log to verify data is fresh
          console.log(`Fresh stats for ${github_username}:`, {
            fromCache: response.data.data.fromCache || false,
            commits: response.data.data.commits,
            lastUpdated: response.data.data.lastUpdated
          });
          
          return {
            ...member,
            stats: {
              ...response.data.data,
              isCached: false // Explicitly mark as fresh data
            }
          };
        } catch (memberError) {
          console.error(`Error fetching stats for ${member.github_username}:`, memberError);
          return member;
        }
      }));
      
      // Update team with fresh data
      setTeam(prevTeam => ({
        ...prevTeam,
        member_profiles: updatedProfiles
      }));
      
      console.log("Successfully fetched fresh data for ALL GitHub statistics!");
      return true;
    } catch (error) {
      console.error('Error fetching fresh data:', error);
      return false;
    } finally {
      setIsFetchingFreshData(false);
    }
  };

  const resetFieldStatus = () => {
    setFieldStatus({
      projectLink: { loading: false, valid: null },
      videoLink: { loading: false, valid: null },
      description: { loading: false, valid: null }
    });
  };

  // Handle description changes with character count
  const handleDescriptionChange = (e) => {
    const text = e.target.value;
    const charCount = text.length;
    setWordCount(charCount);
    
    if (charCount > 500) {
      setError('Description should not exceed 500 characters');
    } else {
      setError('');
    }
    
    setDescription(text);
  };

  // Handle logo file selection
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Check file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Logo must be a JPG or PNG file');
      return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 1 * 1024 * 1024) {
      setError('Logo must be less than 1MB');
      return;
    }
    
    setLogo(file);
    setError('');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!team) {
        toast.error("No team data available. Please connect a repository first.");
        return;
      }
      
      setError('');
      resetFieldStatus();

      // Validate required fields first
      const validationErrors = [];
      
      if (!projectLink) {
        validationErrors.push("Project Link is required");
      }
      
      if (!description) {
        validationErrors.push("Project Description is required");
      } else if (wordCount < 300) {
        validationErrors.push("Description must be at least 300 characters");
      } else if (wordCount > 500) {
        validationErrors.push("Description must not exceed 500 characters");
      }
      
      if (!logo) {
        validationErrors.push("Project Logo is required");
      }

      if (validationErrors.length > 0) {
        setError(
          <div className="space-y-1">
            {validationErrors.map((message, index) => (
              <p className="text-sm whitespace-pre-wrap break-all" key={index}>{message}</p>
            ))}
          </div>
        );
        return;
      }

      // Start submission process with visual feedback
      setCurrentSubmissionStep('starting');
      toast.loading("Starting project submission process...", { duration: 2000 });
      
      // Show submission preview
      setShowSubmissionPreview(true);
      
      // Fetch fresh data before submission - automatic without user intervention
      await new Promise(resolve => setTimeout(resolve, 1500)); // Short pause for visual flow
      
      setCurrentSubmissionStep('fetching');
      toast.loading("Fetching latest GitHub statistics for your project...", { duration: 4000 });
      const freshDataFetched = await fetchFreshData();
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Short pause for visual flow
      
      if (!freshDataFetched) {
        toast.dismiss();
        const wantToContinue = window.confirm(
          "We couldn't fetch the most up-to-date GitHub statistics. Do you want to proceed with potentially outdated data?\n\n" +
          "For the most accurate submission, we recommend trying again to get fresh data."
        );
        
        if (!wantToContinue) {
          setShowSubmissionPreview(false);
          toast.error("Submission canceled. Please try again when GitHub data can be refreshed.");
          return;
        }
        
        toast.warning("Proceeding with existing data. Some GitHub statistics may not be up-to-date.");
        await new Promise(resolve => setTimeout(resolve, 1000)); // Let user read warning
      } else {
        toast.success("Successfully fetched the latest GitHub statistics!");
        await new Promise(resolve => setTimeout(resolve, 1500)); // Short pause to see success message
      }
      
      // Set loading state for all fields
      setFieldStatus(prev => ({
        projectLink: { ...prev.projectLink, loading: true },
        videoLink: { ...prev.videoLink, loading: true },
        description: { ...prev.description, loading: true }
      }));

      // Validate user-provided fields
      setCurrentSubmissionStep('validating');
      toast.loading("Validating your project details...");
      const response = await axios.post('http://localhost:5000/api/validate/submit-project', {
        projectLink,
        videoLink,
        description
      }, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        }
      });
      
      toast.dismiss();

      // Update field status based on validation
      setFieldStatus({
        projectLink: { loading: false, valid: response.data.projectLink.isValid },
        videoLink: { loading: false, valid: response.data.videoLink.isValid },
        description: { loading: false, valid: response.data.description.isValid }
      });

      if (!response.data.success) {
        const invalidFields = [];
        
        if (!response.data.projectLink.isValid) {
          invalidFields.push(`Project Link: ${response.data.projectLink.reason}`);
        }
        if (!response.data.videoLink.isValid) {
          invalidFields.push(`Video Link: ${response.data.videoLink.reason}`);
        }
        if (!response.data.description.isValid) {
          invalidFields.push(`Description: ${response.data.description.reason}`);
        }

        setError(
          <div className="space-y-1">
            {invalidFields.map((message, index) => (
              <p className="text-sm whitespace-pre-wrap break-all" key={index}>{message}</p>
            ))}
          </div>
        );
        toast.error("Some fields need your attention.");
        setShowSubmissionPreview(false);
        return;
      }
      
      toast.success("All fields validated successfully!");
      await new Promise(resolve => setTimeout(resolve, 1000)); // Short pause to see success message

      //upload logo 
      setCurrentSubmissionStep('uploading');
      const formData = new FormData();
      formData.append('logo', logo);

      // Reset upload states before starting
      setUploadProgress(0);
      setUploadSuccess(false);
      setUploadComplete(false);

      toast.loading("Uploading project logo...");
      
      const logoResponse = await axios.post(
        'http://localhost:5000/api/project-submit/logo-upload', 
        formData, 
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
            if (progress === 100) {
              // Add a small delay before showing completion
              setTimeout(() => {
                setUploadSuccess(true);
                setUploadComplete(true);
              }, 500);
            }
          },
        }
      );

      toast.dismiss();
      
      if (!logoResponse.data.success) {
        setShowSubmissionPreview(false);
        throw new Error('Failed to upload logo');
      }

      const logoUrl = logoResponse.data.logoUrl;
      toast.success("Logo uploaded successfully!");
      await new Promise(resolve => setTimeout(resolve, 1000)); // Short pause to see success message

      // If validation successful, proceed with form submission
      setIsSubmitting(true);
      setCurrentSubmissionStep('preparing');
      toast.loading("Preparing final submission data...");
      await new Promise(resolve => setTimeout(resolve, 1500)); // Short pause for visual flow
      
      // Visual indication of which data we're submitting
      setCurrentSubmissionStep('submitting');
      toast.loading("Submitting project details and GitHub activity stats...");
      
      // Create form data for final submission
      const submitFormData = new FormData();
      submitFormData.append('projectLink', projectLink);
      submitFormData.append('videoLink', videoLink);
      submitFormData.append('description', description);
      submitFormData.append('logoUrl', logoUrl); // Send the logo URL instead of file
      submitFormData.append('ideaId', ideaId);
      submitFormData.append('repoName', team.repo_name);
      submitFormData.append('repoUrl', team.repo_url);
      submitFormData.append('start_date', team.updated_at);
      submitFormData.append('repoStats', JSON.stringify(repostats));
      submitFormData.append('memberStats', JSON.stringify(team.member_profiles));

      // Log submission summary to console
      console.log('Project Submission Summary:', {
        projectDetails: {
          link: projectLink,
          video: videoLink ? "Provided" : "Not provided",
          description: description.substring(0, 50) + "...",
          logo: logoUrl
        },
        repositoryStats: {
          repo: team.repo_name,
          commits: repostats?.commitCount || 0,
          pulls: repostats?.pullCount || 0,
          issues: repostats?.issueCount || 0
        },
        teamStats: {
          memberCount: team.member_profiles?.length || 0,
          // Example of first member stats if available
          firstMember: team.member_profiles?.length > 0 ? {
            name: team.member_profiles[0].github_username,
            commits: team.member_profiles[0].stats?.commits || 0
          } : "No members"
        }
      });
      
      // Submit to backend with a slight delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 2000)); // Short pause for visual flow
      
      const submitResponse = await axios.post(
        `http://localhost:5000/api/manage-team/submit-project/${ideaId}`,
        submitFormData,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      toast.dismiss();
      
      if (submitResponse.data.success) {
        setCurrentSubmissionStep('success');
        // Show success animation
        toast.success('Project submitted successfully!');
        
        setTimeout(() => {
          toast.success('Your submission includes all GitHub statistics from the entire project duration.', {
            duration: 5000,
            icon: '📊'
          });
        }, 1500);
        
        // Reset form with a slight delay for better UX
        setTimeout(() => {
          setProjectLink('');
          setVideoLink('');
          setDocumentLink('');
          setDescription('');
          setLogo(null);
          setLogoPreview(null);
          setShowSubmissionPreview(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 3000);
      } else {
        setCurrentSubmissionStep('error');
        toast.error(submitResponse.data.error || 'Failed to submit project');
        setTimeout(() => {
          setShowSubmissionPreview(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting project:', error);
      toast.dismiss();
      toast.error('Failed to submit project: ' + (error.message || 'Unknown error'));
      resetFieldStatus();
      setCurrentSubmissionStep('error');
      setTimeout(() => {
        setShowSubmissionPreview(false);
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const StatusIndicator = ({ status }) => {
    if (status.loading) {
      return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
    }
    if (status.valid === true) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    if (status.valid === false) {
      return <XCircle className="w-4 h-4 text-destructive" />;
    }
    return null;
  };

  // Submission Preview Component
  const SubmissionPreview = () => {
    if (!showSubmissionPreview) return null;
    
    // Determine which step is active
    const isActive = (step) => currentSubmissionStep === step;
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed bottom-6 right-6 bg-card shadow-lg border border-border rounded-lg p-4 w-80 z-50"
      >
        <h4 className="font-semibold text-sm mb-3 flex items-center justify-between">
          <span>Submission Progress</span>
          {currentSubmissionStep === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
          {currentSubmissionStep === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
        </h4>
        
        <div className="space-y-2 text-xs">
          <div className={`flex items-center gap-2 ${isActive('starting') ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            {isActive('starting') ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
            <span>Initializing submission</span>
          </div>
          
          <div className={`flex items-center gap-2 ${isActive('fetching') ? 'text-primary font-medium' : (currentSubmissionStep === 'starting' ? 'text-muted-foreground/50' : 'text-muted-foreground')}`}>
            {isActive('fetching') ? <Loader2 className="h-3 w-3 animate-spin" /> : 
              (currentSubmissionStep === 'starting' ? <div className="h-3 w-3 rounded-full border border-muted-foreground/50" /> : <CheckCircle className="h-3 w-3" />)}
            <span>Fetching GitHub statistics</span>
          </div>
          
          <div className={`flex items-center gap-2 ${isActive('validating') ? 'text-primary font-medium' : (['starting', 'fetching'].includes(currentSubmissionStep) ? 'text-muted-foreground/50' : 'text-muted-foreground')}`}>
            {isActive('validating') ? <Loader2 className="h-3 w-3 animate-spin" /> : 
              (['starting', 'fetching'].includes(currentSubmissionStep) ? <div className="h-3 w-3 rounded-full border border-muted-foreground/50" /> : <CheckCircle className="h-3 w-3" />)}
            <span>Validating project details</span>
          </div>
          
          <div className={`flex items-center gap-2 ${isActive('uploading') ? 'text-primary font-medium' : (['starting', 'fetching', 'validating'].includes(currentSubmissionStep) ? 'text-muted-foreground/50' : 'text-muted-foreground')}`}>
            {isActive('uploading') ? <Loader2 className="h-3 w-3 animate-spin" /> : 
              (['starting', 'fetching', 'validating'].includes(currentSubmissionStep) ? <div className="h-3 w-3 rounded-full border border-muted-foreground/50" /> : <CheckCircle className="h-3 w-3" />)}
            <span>Uploading project logo</span>
          </div>
          
          <div className={`flex items-center gap-2 ${isActive('preparing') ? 'text-primary font-medium' : (['starting', 'fetching', 'validating', 'uploading'].includes(currentSubmissionStep) ? 'text-muted-foreground/50' : 'text-muted-foreground')}`}>
            {isActive('preparing') ? <Loader2 className="h-3 w-3 animate-spin" /> : 
              (['starting', 'fetching', 'validating', 'uploading'].includes(currentSubmissionStep) ? <div className="h-3 w-3 rounded-full border border-muted-foreground/50" /> : <CheckCircle className="h-3 w-3" />)}
            <span>Preparing submission data</span>
          </div>
          
          <div className={`flex items-center gap-2 ${isActive('submitting') ? 'text-primary font-medium' : (['starting', 'fetching', 'validating', 'uploading', 'preparing'].includes(currentSubmissionStep) ? 'text-muted-foreground/50' : 'text-muted-foreground')}`}>
            {isActive('submitting') ? <Loader2 className="h-3 w-3 animate-spin" /> : 
              (['starting', 'fetching', 'validating', 'uploading', 'preparing'].includes(currentSubmissionStep) ? <div className="h-3 w-3 rounded-full border border-muted-foreground/50" /> : <CheckCircle className="h-3 w-3" />)}
            <span>Submitting to server</span>
          </div>
          
          {isActive('success') && (
            <div className="flex items-center gap-2 text-green-500 font-medium mt-2">
              <CheckCircle className="h-3 w-3" />
              <span>Submission completed successfully!</span>
            </div>
          )}
          
          {isActive('error') && (
            <div className="flex items-center gap-2 text-destructive font-medium mt-2">
              <AlertCircle className="h-3 w-3" />
              <span>Error during submission. Please try again.</span>
            </div>
          )}
        </div>
        
        {(currentSubmissionStep === 'submitting' || currentSubmissionStep === 'success') && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-xs font-medium mb-1">Submitting Data Summary:</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
              <span className="text-muted-foreground">Repository:</span>
              <span className="truncate">{team?.repo_name}</span>
              
              <span className="text-muted-foreground">Commits:</span>
              <span>{repostats?.commitCount || 0}</span>
              
              <span className="text-muted-foreground">Team Members:</span>
              <span>{team?.member_profiles?.length || 0}</span>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main form card */}
      <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Project Submission</h2>
          <button
            type="button"
            onClick={() => setShowGuidelines(!showGuidelines)}
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
          >
            <Info className="h-4 w-4" />
            <span>{showGuidelines ? 'Hide' : 'Show'} Tips</span>
          </button>
        </div>

        {/* Repository Status */}
        {team && team.repo_name ? (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md p-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-400">
              <Github className="h-4 w-4" />
              <span>Connected to repository: <strong>{team.repo_name}</strong></span>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-md p-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-400">
              <AlertCircle className="h-4 w-4" />
              <span>Please connect a GitHub repository before submitting your project.</span>
            </div>
          </div>
        )}

        {/* Guidelines section */}
        {showGuidelines && (
          <div className="bg-muted/40 border border-border rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" /> 
              Submission Tips and Scoring Criteria
            </h3>
            <div className="text-sm space-y-4">
              <div>
                <h4 className="font-medium mb-1">Submission Tips:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Innovation and creativity (25 points)</li>
                  <li>Technical implementation (30 points)</li>
                  <li>User experience and design (20 points)</li>
                  <li>Presentation and documentation (15 points)</li>
                  <li>Adherence to project requirements (10 points)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">Requirements:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Project must be accessible via the provided link</li>
                  <li>Description should clearly explain your project (300-500 characters)</li>
                  <li>Logo must be in JPG or PNG format (max 1MB)</li>
                  <li>Video demonstrations are highly recommended</li>
                  <li>All submissions are final after the deadline</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Submission form */}
        <div className="space-y-4">
          {/* Project Link */}  
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <LinkIcon className="h-4 w-4 text-primary" />
              Project Link
            </label>
            <div className="relative">
              <input
                type="url"
                value={projectLink}
                onChange={(e) => setProjectLink(e.target.value)}
                placeholder="https://your-project-link.com"
                className="flex-1 px-3 py-2 bg-white dark:bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full pr-8"
                required
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <StatusIndicator status={fieldStatus.projectLink} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              The main link to your deployed project or any relevant links
            </p>
          </div>

          {/* Video Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
                <Video className="h-4 w-4 text-primary" />
                Video Demonstration Link (Optional)
            </label>
            <div className="relative">
              <input
                type="url"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                placeholder="https://youtube.com/your-demo"
                className="flex-1 px-3 py-2 bg-white dark:bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full pr-8"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <StatusIndicator status={fieldStatus.videoLink} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Link to a video file which shows your project in action... This is optional but is a plus point if you provide it.
            </p>
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Text className="h-4 w-4 text-primary" />
                    <span>
                        Project Description
                    </span>
                </div>
               <span className={`text-xs ${
                wordCount < 300 
                  ? 'text-destructive' 
                  : wordCount > 500 
                    ? 'text-destructive' 
                    : 'text-blue-500'
              }`}>
                {wordCount}/500 characters
              </span>
            </label>
            <div className="relative">
              <textarea
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Describe your project (minimum 300 characters, maximum 500 characters)..."
                className="flex-1 px-3 py-2 bg-white dark:bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full min-h-[150px] pr-8"
                required
              />
              <div className="absolute right-2 top-6">
                <StatusIndicator status={fieldStatus.description} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Explain what your project does, the technologies used and how it is innovative (300-500 characters)
            </p>
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground mb-1">
              Project Logo <span className='text-red-500'>*</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleLogoChange}
                className="hidden"
                id="logo-upload"
                ref={fileInputRef}
              />
              <label
                htmlFor="logo-upload"
                className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors relative"
              >
                <div className="flex flex-col items-center space-y-2 py-4 w-full">
                  {uploadSuccess ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-green-500"
                    >
                      <CheckCircle2 className="w-8 h-8" />
                    </motion.div>
                  ) : logoPreview ? (
                    <div className="relative w-32 h-32">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="w-full h-full object-contain" 
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setLogo(null);
                          setLogoPreview(null);
                          setUploadProgress(0);
                          setUploadSuccess(false);
                          setUploadComplete(false);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-destructive rounded-full text-white hover:bg-destructive/90"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <Upload className={`w-8 h-8 text-muted-foreground ${uploadProgress > 0 && uploadProgress < 100 ? 'animate-bounce' : ''}`} />
                  )}
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    {logo ? (
                      <>
                        {logo.name}
                        {uploadComplete && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-green-500 text-xs"
                          >
                            (Upload Complete)
                          </motion.span>
                        )}
                      </>
                    ) : (
                      'Upload your project logo (JPG/PNG, max 1MB)'
                    )}
                  </span>
                  {uploadProgress > 0 && (
                    <div className="w-full max-w-xs h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${uploadProgress}%`,
                          transition: { duration: 0.3 }
                        }}
                        style={{
                          backgroundImage: uploadProgress < 100 ? 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)' : 'none',
                          backgroundSize: '1rem 1rem',
                          animation: uploadProgress < 100 ? 'progress-stripes 1s linear infinite' : 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Upload a logo or icon that represents your project (JPG or PNG format)
              <br />
              <strong className="text-xs text-muted-foreground">
                This would be considered as your final logo you cannot change it once submitted.
              </strong>
            </p>
          </div>
          {error && (
            <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-md flex gap-2 text-sm text-destructive whitespace-pre-wrap">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-md font-medium text-sm transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Submit Project
                </>
              )}
            </button>
          </div>
          
        </div>
      </div>

      {/* GitHub Statistics Section */}
      {team && team.repo_name && (
        <div className="mt-6 bg-muted/30 border border-border rounded-lg p-4">
          <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
            <Github className="h-5 w-5" /> 
            GitHub Statistics to be Included in Submission
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Repository Stats */}
            <div className="border border-border rounded-md p-3 bg-card">
              <h4 className="font-medium text-sm mb-2">Repository Activity</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Commits:</span>
                  <span className="font-medium">{repostats?.commitCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pull Requests:</span>
                  <span className="font-medium">{repostats?.pullCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Issues:</span>
                  <span className="font-medium">{repostats?.issueCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Data Freshness:</span>
                  <span className={`font-medium ${repostats?.isCached ? 'text-yellow-500' : 'text-green-500'}`}>
                    {repostats?.isCached ? 'Cached' : 'Fresh'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-medium text-xs">
                    {repostats?.lastUpdated 
                      ? new Date(repostats.lastUpdated).toLocaleString() 
                      : 'Not available'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Team Stats Summary */}
            <div className="border border-border rounded-md p-3 bg-card">
              <h4 className="font-medium text-sm mb-2">Team Contributions</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Team Members:</span>
                  <span className="font-medium">{team?.member_profiles?.length || 0}</span>
                </div>
                
                {team?.member_profiles?.slice(0, 3).map((member, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-muted-foreground truncate max-w-[150px]">
                      {member.github_username || member.full_name}:
                    </span>
                    <span className="font-medium">
                      {member.stats?.commits || 0} commits
                    </span>
                  </div>
                ))}
                
                {team?.member_profiles?.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center mt-1">
                    +{team.member_profiles.length - 3} more team members
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <span className="text-xs text-muted-foreground px-3 py-1.5 bg-background border border-border rounded-full inline-block">
              These statistics reflect all activity since the repository was connected on {new Date(team?.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}

      {/* Submission Preview Overlay */}
      <SubmissionPreview />

      <style jsx>{`
        @keyframes progress-stripes {
          from { background-position: 1rem 0; }
          to { background-position: 0 0; }
        }
      `}</style>
    </div>
  );
};

export default Submit;
