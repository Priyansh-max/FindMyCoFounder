import { useState, useRef } from 'react';
import { Upload, Video, Text, Image, Info, FileText, AlertCircle, Loader2, CheckCircle, Link as LinkIcon, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';

const Submit = ({ session, ideaId, team }) => {

  console.log(team);
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

  const uploadLogo = async () => {
    if (!logo) return null;

    try {
      setUploadProgress(0);
      setUploadSuccess(false);
      setUploadComplete(false);

      console.log(session);

      const response = await axios.post(
        `http://localhost:5000/api/project-submit/logo-upload`, 
        logo,
        {
          headers: {
            'authorization': `Bearer ${session.access_token}`
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          },
        }
      );

      setUploadSuccess(true);
      setUploadComplete(true);
      return response.data.logoUrl;
    } catch (error) {
      console.error('Resume upload error:', error);
      setUploadSuccess(false);
      setUploadComplete(false);
      throw new Error('Failed to upload resume');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
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
      
      // Set loading state for all fields
      setFieldStatus(prev => ({
        projectLink: { ...prev.projectLink, loading: true },
        videoLink: { ...prev.videoLink, loading: true },
        description: { ...prev.description, loading: true }
      }));

      // Validate using backend
      const response = await axios.post('http://localhost:5000/api/validate/submit-project', {
        projectLink,
        videoLink,
        description
      }, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        }
      });

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
        return;
      }

      console.log(logo);
      //upload logo 
      const formData = new FormData();
      formData.append('logo', logo);

      // Reset upload states before starting
      setUploadProgress(0);
      setUploadSuccess(false);
      setUploadComplete(false);

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

      if (!logoResponse.data.success) {
        throw new Error('Failed to upload logo');
      }

      const logoUrl = logoResponse.data.logoUrl;
      console.log(logoUrl);

      // If validation successful, proceed with form submission
      setIsSubmitting(true);
      
      // Create form data for final submission
      const submitFormData = new FormData();
      submitFormData.append('projectLink', projectLink);
      submitFormData.append('videoLink', videoLink);
      submitFormData.append('documentLink', documentLink);
      submitFormData.append('description', description);
      submitFormData.append('logoUrl', logoUrl); // Send the logo URL instead of file
      submitFormData.append('ideaId', ideaId);
      
      // Submit to backend
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
      
      if (submitResponse.data.success) {
        toast.success('Project submitted successfully');
        // Reset form
        setProjectLink('');
        setVideoLink('');
        setDocumentLink('');
        setDescription('');
        setLogo(null);
        setLogoPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        toast.error(submitResponse.data.error || 'Failed to submit project1111');
      }
    } catch (error) {
      console.error('Error submitting project:', error);
      toast.error('Failed to submit project');
      resetFieldStatus();
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
