import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { PlusCircle, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

function IdeaForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    ideaDescription: '',
    developerNeeds: '',
    partnershipTerms: '',
    equityTerms: ''
  });

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
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="w-6 h-6" />
          Submit New Startup Idea
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <label htmlFor="companyName" className="text-sm font-medium">
              Company Name
            </label>
            <Input
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              placeholder="Enter company name"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="ideaDescription" className="text-sm font-medium">
              Idea Description
            </label>
            <Textarea
              id="ideaDescription"
              name="ideaDescription"
              value={formData.ideaDescription}
              onChange={handleChange}
              required
              placeholder="Describe your startup idea in detail"
              className="w-full min-h-32"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="developerNeeds" className="text-sm font-medium">
              Developer Requirements
            </label>
            <Textarea
              id="developerNeeds"
              name="developerNeeds"
              value={formData.developerNeeds}
              onChange={handleChange}
              required
              placeholder="What kind of developers are you looking for? List specific skills and experience needed."
              className="w-full min-h-24"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="partnershipTerms" className="text-sm font-medium">
              Partnership Terms
            </label>
            <Textarea
              id="partnershipTerms"
              name="partnershipTerms"
              value={formData.partnershipTerms}
              onChange={handleChange}
              required
              placeholder="Describe the partnership terms and expectations"
              className="w-full min-h-24"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="equityTerms" className="text-sm font-medium">
              Equity Terms
            </label>
            <Textarea
              id="equityTerms"
              name="equityTerms"
              value={formData.equityTerms}
              onChange={handleChange}
              required
              placeholder="Detail the equity split and vesting terms"
              className="w-full min-h-24"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Submitting...' : 'Submit Idea'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default IdeaForm;