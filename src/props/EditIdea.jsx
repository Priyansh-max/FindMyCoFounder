import React , { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlusCircle, User, Building2, Lightbulb, Code2, Handshake, PieChart, Send, Loader2 , PenLine } from 'lucide-react';

const EditIdea = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        ideaDescription: '',
        developerNeeds: '',
        additionalDetails: ''
      });
    
      const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      };
    
      const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
      };
    return (
        <div className="space-y-8 px-4 py-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Edit Your Idea
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="companyName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <PenLine className="w-4 h-4 text-gray-500" />
                      Title
                    </label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="Enter the title of your idea"
                      className="w-full transition-all duration-200 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2 relative">
                    <label htmlFor="ideaDescription" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-gray-500" />
                      Idea Description
                    </label>
                    <Textarea
                      id="ideaDescription"
                      name="ideaDescription"
                      value={formData.ideaDescription}
                      onChange={handleChange}
                      required
                      placeholder="Describe your startup idea in detail"
                      className="w-full min-h-32 transition-all duration-200 focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className={`absolute bottom-2 italic right-2 text-sm ${formData.ideaDescription.length < 100 ? "text-red-500" : "text-green-500"}`}>
                    {formData.ideaDescription.length}/100</span>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="developerNeeds" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-gray-500" />
                      Developer Requirements
                    </label>
                    <Textarea
                      id="developerNeeds"
                      name="developerNeeds"
                      value={formData.developerNeeds}
                      onChange={handleChange}
                      required
                      placeholder="What kind of developers are you looking for? List specific skills and experience needed."
                      className="w-full min-h-24 transition-all duration-200 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="partnershipTerms" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Handshake className="w-4 h-4 text-gray-500" />
                      Additional Information
                    </label>
                    <Textarea
                      id="additional"
                      name="additional"
                      value={formData.additionalDetails}
                      onChange={handleChange}
                      required
                      placeholder="Describe any additional information here"
                      className="w-full min-h-24 transition-all duration-200 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
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
      </div>
    )
}

export default EditIdea;