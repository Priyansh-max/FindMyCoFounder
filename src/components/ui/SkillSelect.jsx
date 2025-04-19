import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { X } from 'lucide-react';

const SKILL_SUGGESTIONS = [
  // Programming Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Go', 'Rust', 'Perl', 'Scala', 'Haskell', 'Dart', 'Elixir', 'C#', 'Shell Scripting',

  // Web Technologies
  'React', 'Angular', 'Vue.js', 'Node.js', 'Express.js', 'Django', 'Flask', 'Laravel', 'Svelte', 'Next.js', 'Nuxt.js', 'SolidJS', 'FastAPI', 'Spring Boot', 'ASP.NET', 'WebAssembly',

  // Frontend Development
  'HTML', 'CSS', 'SCSS', 'Bootstrap', 'Tailwind CSS', 'Chakra UI', 'Material UI', 'Three.js', 'Framer Motion', 'GSAP',

  // Mobile Development
  'React Native', 'Flutter', 'iOS Development', 'Android Development', 'SwiftUI', 'Jetpack Compose', 'Xamarin', 'Ionic', 'Cordova',

  // Database
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'SQLite', 'MariaDB', 'Cassandra', 'DynamoDB', 'Neo4j', 'CouchDB', 'Realm', 'Supabase',

  // Cloud & DevOps
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Ansible', 'Jenkins', 'GitHub Actions', 'CircleCI', 'Travis CI', 'Helm', 'OpenShift', 'Serverless',

  // AI & ML
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Computer Vision', 'NLP', 'Scikit-Learn', 'OpenCV', 'Hugging Face Transformers', 'Reinforcement Learning', 'Stable Diffusion', 'GANs', 'AutoML', 'ONNX',

  // Data Science & Analytics
  'Data Analysis', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Data Visualization', 'Big Data', 'Hadoop', 'Apache Spark', 'Kafka', 'ETL', 'Power BI', 'Tableau',

  // Cybersecurity
  'Ethical Hacking', 'Penetration Testing', 'Cryptography', 'OWASP', 'SOC', 'SIEM', 'Intrusion Detection', 'Reverse Engineering', 'Digital Forensics',

  // Networking & System Administration
  'Linux', 'Bash Scripting', 'Windows Server', 'Nginx', 'Apache', 'Networking', 'TCP/IP', 'Firewall Management', 'VPN Configuration', 'Load Balancing',

  // Other
  'Blockchain', 'Solidity', 'Smart Contracts', 'Web3.js', 'Hardhat', 'Truffle', 'NFT Development', 'WebGL', 'Unity', 'Game Development', 'Unreal Engine', 'UI/UX Design', 'GraphQL', 'REST API', 'gRPC', 'Microservices', 'Message Queues (RabbitMQ, Kafka)', 'ROS (Robot Operating System)', 'Embedded Systems', 'IoT Development', 'AR/VR Development', 'Meta Quest Development', 'TDD (Test-Driven Development)', 'Figma', 'Adobe XD', 'Git', 'Agile Development', 'Scrum', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Ansible', 'Jenkins', 'GitHub Actions', 'CircleCI', 'Travis CI', 'Helm', 'OpenShift', 'Serverless',
];


const SkillSelect = ({ selectedSkills, setSelectedSkills , text}) => {
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
    <div className="space-y-2 relative">
      {/* Combined Input and Selected Skills */}
      <div 
        className="relative flex flex-wrap items-center gap-2 px-2 rounded-md border border-input bg-white dark:bg-background focus-within:ring-1 focus-within:ring-primary transition-colors"
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
          className="flex-1 min-w-[100px] bg-white dark:bg-background border-none focus:border-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none transition-colors placeholder:text-sm placeholder:text-muted-foreground"
          placeholder={selectedSkills.length === 0 ? text : ""}
        />
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full left-0 right-0 mt-1 max-h-60 overflow-auto rounded-md border border-border bg-white dark:bg-background shadow-lg transition-colors"
          style={{ maxWidth: '100%' }}
        >
          <div className="py-1">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addSkill(suggestion)}
                className="w-full px-4 py-2 text-left hover:bg-accent text-foreground hover:text-accent-foreground transition-colors truncate"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillSelect; 