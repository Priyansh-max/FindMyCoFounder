import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, Link, FileText, User, CheckCircle2, Loader2, Code2, Upload, XCircle } from 'lucide-react';
import supabase from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SkillSelect from '@/components/ui/SkillSelect';
import axios from 'axios';

const OnboardingForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    skills: '',
    githubUrl: '',
    portfolioUrl: '',
    description: '',
    resumeUrl: '',
  });
  const [fieldStatus, setFieldStatus] = useState({
    fullName: { loading: false, valid: null },
    skills: { loading: false, valid: null },
    portfolioUrl: { loading: false, valid: null },
    description: { loading: false, valid: null },
  });

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [user, setUser] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log(user);
      if (user) {
        setUser(user);
        setFormData(prev => ({
          ...prev,
          githubUrl: user.user_metadata?.user_name ? `https://github.com/${user.user_metadata.user_name}` : '',
          github_username: user.user_metadata?.user_name || '',
          email: user.email || ''
        }));
      }
    };
    getUser();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const skills = useMemo(() => selectedSkills.join(', '), [selectedSkills]);

  useEffect(() => {
    setFormData(prevData => ({
      ...prevData,
      skills
    }));
  }, [skills]);

  const resetFieldStatus = () => {
    setFieldStatus({
      fullName: { loading: false, valid: null },
      skills: { loading: false, valid: null },
      portfolioUrl: { loading: false, valid: null },
      description: { loading: false, valid: null },
    });
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

    console.log(formData.get('resume'));
    try {
      setUploadProgress(0);
      setUploadSuccess(false);
      setUploadComplete(false);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authentication session found');
      }

      console.log(session);

      const response = await axios.post(
        `http://localhost:5000/api/profile/resume`, 
        formData,
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
      return response.data.publicUrl;
    } catch (error) {
      console.error('Resume upload error:', error);
      setUploadSuccess(false);
      setUploadComplete(false);
      throw new Error('Failed to upload resume');
    }
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

      if(!resumeFile){
        setError(<>
          Please upload your resume -- <strong>Resume Upload</strong>
        </>);
        return;
      }

      setError('');
      resetFieldStatus();

      const formRecord = {
        ...formData,
        skills: selectedSkills.join(', ')
      };
  
      console.log('Form Record:', formRecord);
  
      setLoading(true);

      setFieldStatus(prev => ({
        fullName: { ...prev.fullName, loading: true },
        skills: { ...prev.skills, loading: true },
        portfolioUrl: { ...prev.portfolioUrl, loading: true },
        description: { ...prev.description, loading: true },
      }));

      const { data: { session } } = await supabase.auth.getSession();

      const response = await axios.post('http://localhost:5000/api/validate/profile', {
        fullName: formRecord.fullName,
        skills: formRecord.skills,
        portfolioUrl: formRecord.portfolioUrl,
        description: formRecord.description
      });

      setFieldStatus({
        fullName: { loading: false, valid: response.data.fullName.isValid },
        skills: { loading: false, valid: response.data.skills.isValid },
        portfolioUrl: { loading: false, valid: response.data.portfolioUrl.isValid },
        description: { loading: false, valid: response.data.description.isValid }
      });

      if(response.data.success){
        const resumeUrl = await uploadResume();
        if (!resumeUrl) {
          throw new Error('Failed to upload resume');
        }

        const profileData = {
          ...formData,
          skills: selectedSkills.join(', '),
          resumeUrl,
          avatar_url: user.user_metadata?.avatar_url
        };

        console.log(profileData);

        try{
          const profileResponse = await axios.post('http://localhost:5000/api/profile/create', profileData, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
          }});

        if(profileResponse.status === 200){
          toast.success('Profile created successfully!');
          navigate('/idealist');
        }
        else{
          throw new Error('Failed to create profile');
        } 
          console.log(profileResponse);
          console.log("posted successfully");
        }
        catch(error){
          console.error('Error:', error);
          setError(error.message);
          toast.error(error.message);
          resetFieldStatus();
        }
      }

      else{
        const invalidFields = [];
        
        if (!response.data.fullName.isValid) {
          invalidFields.push(`fullName: ${response.data.fullName.reason}`);
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



      // const profileData = {
      //   fullName: formData.fullName,
      //   email: formData.email,
      //   githubUrl: formData.githubUrl,
      //   portfolioUrl: formData.portfolioUrl || '',
      //   description: formData.description,
      //   resumeUrl,
      //   skills: selectedSkills.join(', ')
      // };

      // const profileResponse = await axios.post('http://localhost:5000/api/profile/creat', profileData, {
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${session.access_token}`
      //   }
      // });

      // toast.success('Profile created successfully!');
      // navigate('/idealist');

    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      toast.error(error.message);
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

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <motion.div
        className="max-w-2xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        transition={{ duration: 0.5 }}
      >
        {user && (
          <div className="mb-8 bg-card text-card-foreground rounded-xl p-6 shadow-xl dark:shadow-primary/10 border border-border overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="flex items-center gap-6 relative">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
                <img
                  src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.user_name || 'User')}`}
                  alt="Profile"
                  className="w-20 h-20 rounded-full border-2 border-primary/20 relative z-10"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-foreground">
                    {user.user_metadata?.user_name || 'GitHub User'}
                  </h2>
                  <Github className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-lg text-primary mt-1 font-medium">
                  {`Welcome aboard, Chief! Let's gear up your profile 🚀`}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card text-card-foreground rounded-xl shadow-lg dark:shadow-primary/10 p-6 sm:p-8 border border-border">
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete='new-off'>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <User className="w-5 h-5 text-primary" />
                  Basic Information
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Full Name <span className='text-red-500'>*</span>
                    </label>
                    <div className="relative">
                      <Input
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        placeholder="John Doe"
                        className="w-full bg-white dark:bg-background pr-8"
                        autoComplete="new-off"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <StatusIndicator status={fieldStatus.fullName} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Email <span className='text-red-500'>*</span>
                    </label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled
                      placeholder="john@example.com"
                      className="w-full bg-white dark:bg-background opacity-70"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>

              {/* Skills Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                   Skills <span className='text-red-500'>*</span>
                </label>
                <div className="relative">
                  <SkillSelect
                    selectedSkills={selectedSkills}
                    setSelectedSkills={setSelectedSkills}
                    text="Add Skills....."
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <StatusIndicator status={fieldStatus.skills} />
                  </div>
                </div>
              </div>

              {/* Links Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Link className="w-5 h-5 text-primary" />
                  Your Links
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      GitHub URL <span className='text-red-500'>*</span>
                    </label>
                    <Input
                      name="githubUrl"
                      value={formData.githubUrl}
                      onChange={handleChange}
                      placeholder="https://github.com/username"
                      className="w-full bg-white dark:bg-background"
                      autoComplete="off"
                      disabled
                    />
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
                      autoComplete="off"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <StatusIndicator status={fieldStatus.portfolioUrl} />
                      </div>
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
                    Brief Description <span className='text-red-500'>*</span>
                  </label> 
                  <div className="relative">
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      placeholder="Tell us about yourself, your skills, and what you're looking for..."
                      className="w-full min-h-[100px] bg-white dark:bg-background pr-8"
                      autoComplete="off"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">     
                      <StatusIndicator status={fieldStatus.description} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Resume Upload <span className='text-red-500'>*</span>
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
                    <div className="flex flex-col items-center space-y-2 py-4 w-full">
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
                          'Upload your resume (PDF, max 5MB)'
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
              </div>
            </div>

            <style jsx>{`
              @keyframes progress-stripes {
                from { background-position: 1rem 0; }
                to { background-position: 0 0; }
              }
            `}</style>
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
                  Setting up your profile...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Complete Setup
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingForm; 