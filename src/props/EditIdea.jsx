import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlusCircle, Lightbulb, Code2, Handshake, Send, Loader2, PenLine } from 'lucide-react';
import SkillSelect from '@/components/ui/SkillSelect';
import supabase from '../lib/supabase';
import { toast } from 'react-hot-toast';

const EditIdea = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    ideaDescription: '',
    additionalDetails: ''
  });
  const [ideaId, setIdeaId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Update the idea details
      const { error: ideaError } = await supabase
        .from('ideas')
        .update({
          title: formData.title,
          idea_desc: formData.ideaDescription,
          additional_details: formData.additionalDetails,
        })
        .eq('id', ideaId);

      if (ideaError) throw ideaError;

      // Handle skills update
      if (selectedSkills.length > 0) {
        // First, upsert all skills to ensure they exist
        const { data: skillsData, error: skillsError } = await supabase
          .from('skills')
          .upsert(
            selectedSkills.map(name => ({ name })),
            { onConflict: 'name' }
          )
          .select('id, name');

        if (skillsError) throw skillsError;

        // Delete existing skill associations
        const { error: deleteError } = await supabase
          .from('idea_skills')
          .delete()
          .eq('idea_id', ideaId);

        if (deleteError) throw deleteError;

        // Create new skill associations
        const skillAssociations = skillsData.map(skill => ({
          idea_id: ideaId,
          skill_id: skill.id
        }));

        const { error: associationError } = await supabase
          .from('idea_skills')
          .insert(skillAssociations);

        if (associationError) throw associationError;
      }

      // Success handling
      toast.success('Idea updated successfully!');
    } catch (error) {
      setError('Failed to update idea: ' + error.message);
      toast.error('Failed to update idea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 px-4 py-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Edit Your Idea
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <PenLine className="w-4 h-4 text-muted-foreground" />
              Title
            </label>
            <Input
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter the title of your idea"
              className="w-full bg-background border-border"
            />
          </div>

          <div className="space-y-2 relative">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-muted-foreground" />
              Idea Description
            </label>
            <Textarea
              name="ideaDescription"
              value={formData.ideaDescription}
              onChange={handleChange}
              required
              placeholder="Describe your startup idea in detail"
              className="w-full min-h-32 bg-background border-border"
            />
            <span className={`absolute bottom-2 italic right-2 text-sm ${
              formData.ideaDescription.length < 100 ? "text-destructive" : "text-primary"
            }`}>
              {formData.ideaDescription.length}/100
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Code2 className="w-4 h-4 text-muted-foreground" />
              Developer Requirements
            </label>
            <SkillSelect
              selectedSkills={selectedSkills}
              setSelectedSkills={setSelectedSkills}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Handshake className="w-4 h-4 text-muted-foreground" />
              Additional Information
            </label>
            <Textarea
              name="additionalDetails"
              value={formData.additionalDetails}
              onChange={handleChange}
              placeholder="Describe any additional information here"
              className="w-full min-h-24 bg-background border-border"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Update Idea
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default EditIdea;