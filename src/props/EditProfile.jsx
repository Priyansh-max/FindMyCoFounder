import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Link, FileText, Upload, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SkillSelect from '@/components/ui/SkillSelect';
import supabase from '../lib/supabase';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const EditProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    portfolioUrl: '',
    description: '',
    skills: '',
    resumeUrl: ''
  });
  const [fieldStatus, setFieldStatus] = useState({
    fullName: { loading: false, valid: null },
    skills: { loading: false, valid: null },
    portfolioUrl: { loading: false, valid: null },
    description: { loading: false, valid: null },
  });

  useEffect(() => {
    fetchCurrentProfile();
  }, []);

  const fetchCurrentProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await axios.get('https://findmycofounder.onrender.com/api/profile/details', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.data.success) {
        const profileData = response.data.data;
        setFormData({
          fullName: profileData.full_name || '',
          portfolioUrl: profileData.portfolio_url || '',
          description: profileData.description || '',
          skills: profileData.skills || ''
        });
        setSelectedSkills(profileData.skills ? profileData.skills.split(',').map(s => s.trim()) : []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to fetch profile data');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.includes('pdf')) {
        toast.error('Please upload a PDF file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setResumeFile(file);
    }
  };

  const uploadResume = async () => {
    if (!resumeFile) return null;

    const formData = new FormData();
    formData.append('resume', resumeFile);

    try {
      setUploadProgress(0);
      setUploadSuccess(false);
      setUploadComplete(false);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authentication session found');
      }

      const response = await axios.post(
        'https://findmycofounder.onrender.com/api/profile/resume',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          },
        }
      );

      setUploadSuccess(true);
      setUploadComplete(true);
      return response.data.publicUrl;
    } catch (error) {
      console.error('Resume upload error:', error);
      setUploadSuccess(false);
      setUploadComplete(false);
      throw new Error('Failed to upload resume');
    }
  };

  const resetFieldStatus = () => {
    setFieldStatus({
      fullName: { loading: false, valid: null },
      skills: { loading: false, valid: null },
      portfolioUrl: { loading: false, valid: null },
      description: { loading: false, valid: null },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (selectedSkills.length === 0) {
        setError(<>
          Please select at least one skill -- <strong>Skills</strong>
        </>);
        return;
      }

      setError('');
      resetFieldStatus();
      setLoading(true);

      setFieldStatus(prev => ({
        fullName: { ...prev.fullName, loading: true },
        skills: { ...prev.skills, loading: true },
        portfolioUrl: { ...prev.portfolioUrl, loading: true },
        description: { ...prev.description, loading: true },
      }));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No authentication session found');

      // Validate the form data first
      const response = await axios.post('https://findmycofounder.onrender.com/api/validate/profile', {
        fullName: formData.fullName,
        skills: selectedSkills.join(', '),
        portfolioUrl: formData.portfolioUrl,
        description: formData.description
      });

      setFieldStatus({
        fullName: { loading: false, valid: response.data.fullName.isValid },
        skills: { loading: false, valid: response.data.skills.isValid },
        portfolioUrl: { loading: false, valid: response.data.portfolioUrl.isValid },
        description: { loading: false, valid: response.data.description.isValid }
      });

      if (response.data.success) {
        let resumeUrl = formData.resumeUrl;
        if (resumeFile) {
          resumeUrl = await uploadResume();
          if (!resumeUrl) {
            throw new Error('Failed to upload resume');
          }
        }

        const profileData = {
          fullName: formData.fullName,
          portfolioUrl: formData.portfolioUrl,
          description: formData.description,
          skills: selectedSkills.join(', '),
          resumeUrl
        };

        const updateResponse = await axios.put('https://findmycofounder.onrender.com/api/profile/update', 
          profileData,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          }
        );

        console.log(updateResponse);
        if (updateResponse.data.success) {
          toast.success('Profile updated successfully!');
          window.location.reload();
        }
      } else {
        const invalidFields = [];
        
        if (!response.data.fullName.isValid) {
          invalidFields.push(`Full Name: ${response.data.fullName.reason}`);
        }
        if (!response.data.skills.isValid) {
          invalidFields.push(`Skills: ${response.data.skills.reason}`);
        }
        if (!response.data.portfolioUrl.isValid) {
          invalidFields.push(`Portfolio URL: ${response.data.portfolioUrl.reason}`);
        }
        if (!response.data.description.isValid) {
          invalidFields.push(`Description: ${response.data.description.reason}`);
        }

        setError(
          <div className="space-y-1">
            {invalidFields.map((message, index) => (
              <p key={index}>{message}</p>
            ))}
          </div>
        );
        return;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
      toast.error('Failed to update profile');
      resetFieldStatus();
    } finally {
      setLoading(false);
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
    <div className="space-y-6 px-4">
      <div className="space-y-2">
        <h2 className="text-center text-3xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
          Edit Profile
        </h2>
        <p className="text-center text-muted-foreground text-sm">
          Update your profile information
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 w-full max-w-3xl mx-auto">
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <User className="w-5 h-5 text-primary" />
            Basic Information
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Full Name <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className="w-full bg-white dark:bg-background pr-8"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <StatusIndicator status={fieldStatus.fullName} />
              </div>
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            Skills <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <SkillSelect
              selectedSkills={selectedSkills}
              setSelectedSkills={setSelectedSkills}
              text="Update Skills..."
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <StatusIndicator status={fieldStatus.skills} />
            </div>
          </div>
        </div>

        {/* Portfolio URL */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Link className="w-5 h-5 text-primary" />
            Portfolio Link
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Portfolio URL
            </label>
            <div className="relative">
              <Input
                name="portfolioUrl"
                value={formData.portfolioUrl}
                onChange={handleChange}
                placeholder="https://yourportfolio.com"
                className="w-full bg-white dark:bg-background pr-8"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <StatusIndicator status={fieldStatus.portfolioUrl} />
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <FileText className="w-5 h-5 text-primary" />
            About You
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Brief Description <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Tell us about yourself, your skills, and what you're looking for..."
                className="w-full min-h-[100px] bg-white dark:bg-background pr-8"
              />
              <div className="absolute right-2 top-4">
                <StatusIndicator status={fieldStatus.description} />
              </div>
            </div>
          </div>
        </div>

        {/* Resume Upload */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Update Resume
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors relative"
            >
              <div className="flex flex-col items-center space-y-2 py-4">
                {uploadSuccess ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-green-500"
                  >
                    <CheckCircle2 className="w-8 h-8" />
                  </motion.div>
                ) : (
                  <Upload className={`w-8 h-8 text-muted-foreground ${uploadProgress > 0 && uploadProgress < 100 ? 'animate-bounce' : ''}`} />
                )}
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  {resumeFile ? (
                    <>
                      {resumeFile.name}
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
                    'Upload new resume (PDF, max 5MB)'
                  )}
                </span>
                {uploadProgress > 0 && (
                  <div className="w-full max-w-xs h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
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
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating profile...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default EditProfile;