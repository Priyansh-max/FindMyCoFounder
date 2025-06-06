import React, { useState, useEffect , useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { PlusCircle, Lightbulb, Code2, PenLine, Send, Loader2, Handshake, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import idea from '../assets/idea.png'
import ideadark from '../assets/ideadark.png'
import SkillSelect from '@/components/ui/SkillSelect';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';

function IdeaForm() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [pageloading, setPageloading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    ideaDescription: '',
    developerNeeds: '',
    additionalDetails: ''
  });
  const [selectedSkills, setSelectedSkills] = useState([]);
  const points = [
    { title: "Find teammates", description: "Connect with skilled people." },
    { title: "Bring ideas to life", description: "Turn concepts into projects." },
    { title: "Gain visibility", description: "Attract contributors easily." },
  ];
  const [fieldStatus, setFieldStatus] = useState({
    title: { loading: false, valid: null },
    description: { loading: false, valid: null },
    devReq: { loading: false, valid: null },
    additionalDetails: { loading: false, valid: null }
  });

  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    // Set loading to false after component mounts
    setTimeout(() => {
      setPageloading(false);
    }, 500);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Add effect to update developerNeeds when skills change
  const developerNeeds = useMemo(() => selectedSkills.join(', '), [selectedSkills]);

  useEffect(() => {
    setFormData(prevData => ({
      ...prevData,
      developerNeeds
    }));
  }, [developerNeeds]);
  

  const resetFieldStatus = () => {
    setFieldStatus({
      title: { loading: false, valid: null },
      description: { loading: false, valid: null },
      devReq: { loading: false, valid: null },
      additionalDetails: { loading: false, valid: null }
    });
  };

  const handleSubmitDemo = async(e) => {
    e.preventDefault();
    
    // Validate skills
    if (selectedSkills.length === 0) {
      setError( <>
        Please select at least one skill -- <strong>Developer Requirements</strong>
      </>);
      return;
    }

    if (formData.ideaDescription.length < 100){
      setError(<>
        Description must be atleast 100 characters long -- <strong>Idea Description*</strong>
      </>);
      return;
    }

    setError('');
    resetFieldStatus();

    const formRecord = {
      ...formData,
      developerNeeds: selectedSkills.join(', ')
    };

    console.log('Form Record:', formRecord);

    setLoading(true);

    try {
      // Set all fields to loading
      setFieldStatus(prev => ({
        title: { ...prev.title, loading: true },
        description: { ...prev.description, loading: true },
        devReq: { ...prev.devReq, loading: true },
        additionalDetails: { ...prev.additionalDetails, loading: true }
      }));

      const response = await axios.post(`${apiUrl}/api/validate/idea`, {
        title : formRecord.title,
        description : formRecord.ideaDescription,
        devReq : formRecord.developerNeeds,
        additionalDetails : formRecord.additionalDetails
      });
      
      console.log('Response:', response.data);

      const { data: { session } } = await supabase.auth.getSession();

      // Update field status based on validation results
      setFieldStatus({
        title: { loading: false, valid: response.data.title.isValid },
        description: { loading: false, valid: response.data.description.isValid },
        devReq: { loading: false, valid: response.data.devReq.isValid },
        additionalDetails: { loading: false, valid: response.data.additionalDetails.isValid }
      });

      if(response.data.success){

        const ideaData = {
          ...formData,
          developerNeeds: selectedSkills.join(', ')
        };
        console.log(ideaData);

        try{
          const ideaResponse = await axios.post(`${apiUrl}/api/idea/create`, ideaData, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
          }});

          if(ideaResponse.status === 200){
            toast.success('Idea created successfully!');
            navigate('/idealist');
          }
          else{
            throw new Error('Failed to publish idea');
          } 
            console.log(ideaResponse);
            console.log("listed successfully");
          }
          catch(error){
            console.error('Error:', error);
            setError(error.message);
            toast.error(error.message);
            resetFieldStatus();
          }
        console.log("idea posted successfully");
      }
      else{
        const invalidFields = [];
        
        if (!response.data.title.isValid) {
          invalidFields.push(`Title: ${response.data.title.reason}`);
        }
        if (!response.data.description.isValid) {
          invalidFields.push(`Description: ${response.data.description.reason}`);
        }
        if (!response.data.devReq.isValid) {
          invalidFields.push(`Developer Requirements: ${response.data.devReq.reason}`);
        }
        if (!response.data.additionalDetails.isValid) {
          invalidFields.push(`Additional Details: ${response.data.additionalDetails.reason}`);
        }

        setError(
          <div className="space-y-1">
            {invalidFields.map((message, index) => (
              <p key={index}>{message}</p>
            ))}
          </div>
        );
      }

    } catch (error) {
      console.error('API Error:', error);
      setError('Failed to submit form. Please try again.');
      resetFieldStatus();
    } finally {
      setLoading(false);
    }
  }
  
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

  if (pageloading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }



  return (
    <div className="flex min-h-screen bg-background pt-8 justify-between px-2 sm:px-20 transition-colors duration-200">
      {/* Left Side - Image */}
      <div className="hidden sm:block ml-12 p-12">
        {/* Image Section */}
        <div className="flex justify-center scale-125">
          <motion.img
            src={theme === 'dark' ? ideadark : idea}
            alt="Startup Team"
            className="w-full h-auto rounded-2xl"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Text Section */}
        <div className="p-6 mt-16 justify-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-foreground">Why Post an Idea?</h2>
            <ul className="space-y-3 text-muted-foreground">
              {points.map((point, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <span className="text-primary text-2xl">•</span>
                  <span>
                    <span className="font-semibold text-foreground">{point.title}:</span> {point.description}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 p-0 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-border shadow-xl bg-card/90 backdrop-blur">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-lg sm:text-xl font-bold text-center flex items-center justify-center gap-2">
                <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span className="bg-clip-text text-transparent bg-primary">
                  Create a Project
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitDemo} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm sm:text-base font-medium text-foreground flex items-center gap-2">
                      <PenLine className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      Title
                    </label>
                    <div className="relative">
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="Title goes here :) "
                        className="w-full focus:ring-1 focus:ring-primary pr-8 bg-transparent border-input transition-none placeholder:text-sm placeholder:text-muted-foreground text-sm sm:text-base"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <StatusIndicator status={fieldStatus.title} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 relative">
                    <label htmlFor="ideaDescription" className="text-sm sm:text-base font-medium text-foreground flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      Project Description
                    </label>
                    <div className="relative">
                      <Textarea
                        id="ideaDescription"
                        name="ideaDescription"
                        value={formData.ideaDescription}
                        onChange={handleChange}
                        required
                        placeholder="Describe your initial idea for the developer to get started"
                        className="w-full min-h-32 focus:ring-1 focus:ring-primary pr-8 bg-transparent border-input transition-none placeholder:text-sm placeholder:text-muted-foreground text-sm sm:text-base"
                      />
                      <div className="absolute right-2 top-2">
                        <StatusIndicator status={fieldStatus.description} />
                      </div>
                    </div>
                    <span className={`absolute bottom-2 italic right-2 text-sm ${
                      formData.ideaDescription.length < 100 ? "text-destructive" : "text-primary"
                    }`}>
                      {formData.ideaDescription.length}/100
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="developerNeeds" className="text-sm sm:text-base font-medium text-foreground flex items-center gap-2">
                      <Code2 className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      Developer Requirements
                    </label>
                    <div className="relative">
                      <SkillSelect
                        selectedSkills={selectedSkills}
                        setSelectedSkills={setSelectedSkills}
                        text="Select skills"
                      />
                      <div className="absolute right-2 top-2">
                        <StatusIndicator status={fieldStatus.devReq} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="additionalDetails" className="text-sm sm:text-base font-medium text-foreground flex items-center gap-2">
                      <Handshake className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      Additional Information
                    </label>
                    <div className="relative">
                      <Textarea
                        id="additionalDetails"
                        name="additionalDetails"
                        value={formData.additionalDetails}
                        onChange={handleChange}
                        required
                        placeholder="Describe any additional information here"
                        className="w-full min-h-24 focus:ring-1 focus:ring-primary pr-8 bg-transparent border-input transition-none placeholder:text-sm placeholder:text-muted-foreground text-sm sm:text-base"
                      />
                      <div className="absolute right-2 top-2">
                        <StatusIndicator status={fieldStatus.additionalDetails} />
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" />
                      Submit
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default IdeaForm;