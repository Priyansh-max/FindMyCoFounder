import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { X } from 'lucide-react';

const SKILL_SUGGESTIONS = [
  // Programming Languages
  'JavaScript', 'Python', 'Java', 'C++', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Go', 'Rust',
  // Web Technologies
  'React', 'Angular', 'Vue.js', 'Node.js', 'Express.js', 'Django', 'Flask', 'Laravel',
  // Mobile Development
  'React Native', 'Flutter', 'iOS Development', 'Android Development',
  // Database
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase',
  // Cloud & DevOps
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD',
  // AI & ML
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Computer Vision', 'NLP',
  // Other
  'Blockchain', 'WebGL', 'Unity', 'Game Development', 'UI/UX Design', 'GraphQL', 'REST API'
];

const SkillSelect = ({ selectedSkills, setSelectedSkills }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    // Close suggestions on click outside
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setIsOpen(true);

    if (value.trim()) {
      const filtered = SKILL_SUGGESTIONS.filter(skill =>
        skill.toLowerCase().includes(value.toLowerCase()) &&
        !selectedSkills.includes(skill)
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const addSkill = (skill) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
    }
    setInputValue('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeSkill = (skillToRemove) => {
    setSelectedSkills(selectedSkills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      // If there are suggestions, add the first one
      if (suggestions.length > 0) {
        addSkill(suggestions[0]);
      } else {
        // Otherwise, add the input value as a new skill
        addSkill(inputValue.trim());
      }
    }
  };

  return (
    <div className="space-y-2">
      {/* Combined Input and Selected Skills */}
      <div 
        className="relative flex flex-wrap items-center gap-2 px-2 rounded-md border border-input bg-white dark:bg-background focus-within:ring-1 focus-within:ring-primary"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Selected Skills */}
        {selectedSkills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="ml-2 hover:text-primary/70"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Input using the existing Input component */}
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-[100px] bg-transparent border-none focus:border-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
          placeholder={selectedSkills.length === 0 ? "Add skills..." : ""}
        />
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md border border-border bg-white dark:bg-background shadow-lg"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addSkill(suggestion)}
              className="w-full px-4 py-2 text-left hover:bg-accent text-foreground hover:text-accent-foreground transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillSelect; 