import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { PlusCircle, Lightbulb, Code2, PenLine, Send, Loader2 ,Handshake } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import idea from '../assets/idea.png'

function IdeaForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    ideaDescription: '',
    developerNeeds: '',
    additionalDetails: ''
  });
  const points = [
    { title: "Find teammates", description: "Connect with skilled people." },
    { title: "Bring ideas to life", description: "Turn concepts into projects." },
    { title: "Gain visibility", description: "Attract contributors easily." },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      // Get the current authenticated user
      const { data: userData, error: UserError } = await supabase.auth.getUser();
  
      if (UserError) {
        console.error('Error fetching user:', UserError);
        throw new Error('Error fetching user');
      }
  
      const user = userData.user; // Access the user object from the renamed variable
  
      if (!user) {
        throw new Error('User is not authenticated');
      }
  
      console.log(user.id); // Now this should work and log the user ID
  
      // Get the user's profile information (assuming the profile table contains the profile for the authenticated user)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, is_founder')  // Fetch both id and is_founder
        .eq('id', user.id) // Assuming user.id is linked to your profile table
        .single();
  
      console.log(profile);
      if (profileError || !profile) {
        throw new Error('Profile not found');
      }
  
      // Check if the user is a founder before allowing them to post an idea
      if (!profile.is_founder) {
        throw new Error('You must be a founder to post an idea');
      }
  
      // Insert the new idea with the found founder_id (profile.id)
      const { data, error } = await supabase
        .from('ideas')
        .insert([
          {
            created_at: new Date(),
            founder_id: profile.id, // Use the profile's id as the founder_id
            company_name: formData.companyName,
            idea_desc: formData.ideaDescription,
            dev_req: formData.developerNeeds,
            partner_term: formData.partnershipTerms,
            equity_term: formData.equityTerms,
            status: 'open',
          },
        ]);
  
      if (error) throw error;
  
      // Redirect to success page or ideas list
      navigate('/');
  
    } catch (err) {
      setError(err.message || 'Failed to submit idea. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="flex min-h-screen bg-background pt-8 justify-between px-20 transition-colors duration-200">
      {/* Left Side - Image */}
      <div className="ml-12 p-12">
        {/* Image Section */}
        <div className="flex mt-20 justify-center scale-125">
          <motion.img
            src={idea}
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
      <div className="w-full lg:w-1/2 p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-border shadow-xl bg-card/90 backdrop-blur">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                <PlusCircle className="w-6 h-6 text-primary" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                  Submit New Startup Idea
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="companyName" className="text-sm font-medium text-foreground flex items-center gap-2">
                      <PenLine className="w-4 h-4 text-muted-foreground" />
                      Title
                    </label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="Enter company name"
                      className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary bg-background"
                    />
                  </div>

                  <div className="space-y-2 relative">
                    <label htmlFor="ideaDescription" className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-muted-foreground" />
                      Idea Description
                    </label>
                    <Textarea
                      id="ideaDescription"
                      name="ideaDescription"
                      value={formData.ideaDescription}
                      onChange={handleChange}
                      required
                      placeholder="Describe your startup idea in detail. atleast 100 characters!"
                      className="w-full min-h-32 transition-all duration-200 focus:ring-2 focus:ring-primary bg-background"
                    />
                    <span className={`absolute bottom-2 italic right-2 text-sm ${
                      formData.ideaDescription.length < 100 ? "text-destructive" : "text-primary"
                    }`}>
                      {formData.ideaDescription.length}/100
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="developerNeeds" className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-muted-foreground" />
                      Developer Requirements
                    </label>
                    <Textarea
                      id="developerNeeds"
                      name="developerNeeds"
                      value={formData.developerNeeds}
                      onChange={handleChange}
                      required
                      placeholder="What kind of developers are you looking for? List specific skills and experience needed."
                      className="w-full min-h-24 transition-all duration-200 focus:ring-2 focus:ring-primary bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="additionalDetails" className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Handshake className="w-4 h-4 text-muted-foreground" />
                      Additional Information
                    </label>
                    <Textarea
                      id="additionalDetails"
                      name="additionalDetails"
                      value={formData.additionalDetails}
                      onChange={handleChange}
                      placeholder="Describe any additional information here"
                      className="w-full min-h-24 transition-all duration-200 focus:ring-2 focus:ring-primary bg-background"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" />
                      Submit Idea
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