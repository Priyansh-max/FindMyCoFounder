import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Link, FileText, User, Phone, Mail, CheckCircle2, Loader2, Shield, ShieldCheck, ShieldAlert, X, Code2 } from 'lucide-react';
import supabase from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SkillSelect from '@/components/ui/SkillSelect';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Add this new component for the verification modal
const VerificationModal = ({ isOpen, onClose, type, onVerify }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = Array(6).fill(0).map(() => React.createRef());

  const handleInputChange = (index, value) => {
    if (value.length > 1) value = value[0];
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleVerify = () => {
    onVerify(code.join(''));
    onClose();
  };

  return isOpen ? (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border p-6 rounded-xl shadow-lg max-w-md w-full mx-4"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Verify {type === 'email' ? 'Email' : 'Phone'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-muted-foreground mb-6">
          Enter the verification code sent to your {type === 'email' ? 'email' : 'phone'}
        </p>

        <div className="flex justify-between mb-8">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-lg font-semibold rounded-lg border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Verify
          </button>
        </div>
      </motion.div>
    </div>
  ) : null;
};

const VerificationInput = ({ label, type, value, onChange, name, verificationState, onVerify, placeholder ,autoComplete}) => {
  const state = verificationState[type];
  const isEmail = type === 'email';
  const isValid = isEmail ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) : value.length >= 10;

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        {label}
      </label>
      <div className="relative">
        <Input
          name={name}
          autoComplete={autoComplete}
          type={isEmail ? "email" : "text"}
          value={value}
          onChange={onChange}
          required
          disabled={state.status === 'verified'}
          placeholder={placeholder}
          className="w-full bg-white dark:bg-background pr-24 duration-200"
        />
        <div className="absolute right-1 top-1 bottom-1 flex items-center">
          {state.status === 'verified' ? (
            <span className="flex items-center gap-1 px-3 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              Verified
            </span>
          ) : (
            <button
              type="button"
              disabled={!isValid || state.loading}
              onClick={() => onVerify(type)}
              className="flex items-center gap-1 px-3 h-full rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                bg-red-800/5 dark:bg-red-900/5 hover:bg-primary/10 text-red-600 dark:text-red-500"
            >
              {state.loading ? (
                <div className="flex items-center gap-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Verify
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const OnboardingForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationState, setVerificationState] = useState({
    email: { status: 'idle', loading: false },
    phone: { status: 'idle', loading: false }
  });
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    fullName: '',
    githubUrl: '',
    portfolioUrl: '',
    resumeUrl: '',
    description: ''
  });
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [currentVerificationType, setCurrentVerificationType] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Pre-fill GitHub URL if available
        if (user.user_metadata?.user_name) {
          setFormData(prev => ({
            ...prev,
            githubUrl: `https://github.com/${user.user_metadata.user_name}`
          }));
        }
      }
    };
    getUser();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleVerification = async (type) => {
    setCurrentVerificationType(type);
    setShowVerificationModal(true);
  };

  const handleVerificationComplete = async (code) => {
    setVerificationState(prev => ({
      ...prev,
      [currentVerificationType]: { ...prev[currentVerificationType], loading: true }
    }));

    try {
      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setVerificationState(prev => ({
        ...prev,
        [currentVerificationType]: { status: 'verified', loading: false }
      }));
      toast.success(`${currentVerificationType === 'email' ? 'Email' : 'Phone'} verified successfully!`);
    } catch (error) {
      setVerificationState(prev => ({
        ...prev,
        [currentVerificationType]: { status: 'error', loading: false }
      }));
      toast.error('Verification failed. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.fullName,
          email: formData.email,
          whatsapp_number: formData.phone,
          description: formData.description,
          github_url: formData.githubUrl,
          portfolio_url: formData.portfolioUrl,
          resume_url: formData.resumeUrl,
          updated_at: new Date()
        });

      if (profileError) throw profileError;

      toast.success('Profile created successfully!');
      navigate('/idealist', { replace: true });
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      toast.error('Failed to create profile');
    } finally {
      setLoading(false);
    }
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
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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
                      Full Name
                    </label>
                    <Input
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                      className="w-full bg-white dark:bg-background"
                      autoComplete="new-off"
                    />
                  </div>

                  <VerificationInput
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    name="email"
                    verificationState={verificationState}
                    onVerify={handleVerification}
                    placeholder="john@example.com"
                    autoComplete="off"
                  />

                  <VerificationInput
                    label="Phone Number"
                    type="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    name="phone"
                    verificationState={verificationState}
                    onVerify={handleVerification}
                    placeholder="+1 (555) 000-0000"
                    autoComplete="new-off"
                  />
                </div>
              </div>

              {/* Skills Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                   Skills
                </label>
                <div className="relative">
                  <SkillSelect
                    selectedSkills={selectedSkills}
                    setSelectedSkills={setSelectedSkills}
                  />
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
                      GitHub URL
                    </label>
                    <Input
                      name="githubUrl"
                      value={formData.githubUrl}
                      onChange={handleChange}
                      placeholder="https://github.com/username"
                      className="w-full bg-white dark:bg-background"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Portfolio URL
                    </label>
                    <Input
                      name="portfolioUrl"
                      value={formData.portfolioUrl}
                      onChange={handleChange}
                      placeholder="https://yourportfolio.com"
                      className="w-full bg-white dark:bg-background"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Resume URL
                    </label>
                    <Input
                      name="resumeUrl"
                      value={formData.resumeUrl}
                      onChange={handleChange}
                      placeholder="https://drive.google.com/resume"
                      className="w-full bg-white dark:bg-background"
                      autoComplete="off"
                    />
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
                    Brief Description
                  </label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    placeholder="Tell us about yourself, your skills, and what you're looking for..."
                    className="w-full min-h-[100px] bg-white dark:bg-background"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

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
      <AnimatePresence>
        <VerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          type={currentVerificationType}
          onVerify={handleVerificationComplete}
        />
      </AnimatePresence>
    </div>
  );
};

export default OnboardingForm; 