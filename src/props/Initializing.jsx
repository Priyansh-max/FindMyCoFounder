import React, { useState, useEffect } from "react";
import { CheckCircle, Server, Users, Code, Database, Loader2 } from "lucide-react";

const Initializing = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState([0]); // Initially only show first step
  const [completedSteps, setCompletedSteps] = useState([]); // Track completed steps separately
  const [isFinished, setIsFinished] = useState(false); // Track if all steps are done
  
  const steps = [
    { 
      id: 0, 
      text: "Setting up your team environment...", 
      icon: <Server className="h-5 w-5 text-primary" />,
      duration: 5000
    },
    { 
      id: 1, 
      text: "Initializing database connections...", 
      icon: <Database className="h-5 w-5 text-primary" />,
      duration: 5000
    },
    { 
      id: 2, 
      text: "All set! Your team room is ready.", 
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      duration: 500
    }
  ];

  useEffect(() => {
    // Simulate progress with steps
    let timer;
    if (currentStep < steps.length) {
      // First make the current step visible
      if (!visibleSteps.includes(currentStep)) {
        setVisibleSteps(prev => [...prev, currentStep]);
      }
      
      // After the step's duration, mark it as completed and move to next step
      timer = setTimeout(() => {
        // Mark the current step as completed
        setCompletedSteps(prev => [...prev, currentStep]);
        
        // Move to the next step
        setCurrentStep(prevStep => {
          const nextStep = prevStep + 1;
          // Add next step to visible steps array
          if (nextStep < steps.length) {
            setVisibleSteps(prev => [...prev, nextStep]);
          }
          return nextStep;
        });
      }, steps[currentStep].duration);
    } else if (!isFinished) {
      // All steps are complete, but we want a delay before redirecting
      setIsFinished(true);
      setProgress(100); // Ensure progress bar is at 100%
      
      // Add the last step to completed steps if not already there
      const lastStepIndex = steps.length - 1;
      if (!completedSteps.includes(lastStepIndex)) {
        setCompletedSteps(prev => [...prev, lastStepIndex]);
      }
    }

    return () => clearTimeout(timer);
  }, [currentStep, steps.length, visibleSteps, isFinished, completedSteps]);

  // Effect to handle the final delay before calling onComplete
  useEffect(() => {
    let finishTimer;
    if (isFinished && typeof onComplete === 'function') {
      // Longer delay to appreciate the completed state before navigating
      finishTimer = setTimeout(() => {
        onComplete();
      }, 2500); // 2.5 second delay after completion
    }
    
    return () => clearTimeout(finishTimer);
  }, [isFinished, onComplete]);

  useEffect(() => {
    // Update progress bar
    const totalDuration = steps.reduce((acc, step) => acc + step.duration, 0);
    let elapsed = 0;
    
    for (let i = 0; i < currentStep; i++) {
      elapsed += steps[i].duration;
    }
    
    const progressInterval = setInterval(() => {
      const calculatedProgress = (elapsed / totalDuration) * 100;
      setProgress(prev => {
        const newProgress = Math.min(calculatedProgress, 100);
        return newProgress > prev ? newProgress : prev;
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [currentStep, steps]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="relative w-full max-w-md mx-auto overflow-hidden bg-card border border-border rounded-xl shadow-2xl">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(var(--primary-rgb),0.08),transparent_70%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(var(--primary-rgb),0.08),transparent_70%)]"></div>
        </div>
        
        {/* Main content */}
        <div className="relative z-10 p-8">
          {/* Header with pulsing animation */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75 scale-150"></div>
              <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-4 rounded-full">
                {!isFinished ? (
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                ) : (
                  <CheckCircle className="h-10 w-10 text-green-500" />
                )}
              </div>
            </div>
            <h3 className="text-2xl font-bold mt-6 mb-2 tracking-tight">
              {!isFinished ? "Creating Your Team Room" : "Team Room Created!"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {!isFinished 
                ? "We're setting up a collaborative workspace for your team." 
                : "Your team workspace is ready to use. Redirecting to dashboard..."}
            </p>
          </div>

          {/* Progress bar with animated gradient */}
          <div className="relative h-1.5 w-full bg-muted/40 rounded-full overflow-hidden mb-8">
            <div 
              className={`h-full rounded-full transition-all duration-300 ease-out 
                ${isFinished 
                  ? 'bg-green-500' 
                  : 'bg-gradient-to-r from-primary/90 via-primary to-primary/80'
                }`}
              style={{ width: `${progress}%` }}
            >
              <div className={`absolute top-0 h-full w-full ${isFinished ? 'bg-white/30' : 'bg-white/30 animate-pulse'}`}></div>
            </div>
          </div>

          {/* Steps with animations - only show visible steps */}
          <div className="space-y-5 min-h-[175px]">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center space-x-4 transition-all duration-500 
                  ${visibleSteps.includes(index) ? 'opacity-100 animate-fadeSlideIn' : 'hidden'}
                  ${index === currentStep && !isFinished ? 'scale-102 translate-x-1' : 'opacity-90'}
                `}
                style={{ 
                  animationDelay: `${100 * (index)}ms`,
                }}
              >
                <div className={`
                  flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full 
                  transition-all duration-300
                  ${completedSteps.includes(index) || isFinished
                    ? 'bg-primary/10 text-green-500'
                    : index === currentStep
                    ? 'bg-primary/10 text-primary animate-pulse'
                    : 'bg-muted/70 text-muted-foreground'
                  }
                `}>
                  {completedSteps.includes(index) || (isFinished && index === steps.length - 1) ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : index === currentStep ? (
                    <div className="animate-pulse">{step.icon}</div>
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1">
                  <span className={`text-sm font-medium ${
                    (index === currentStep && !isFinished) ? 'text-foreground' : 
                    completedSteps.includes(index) ? 'text-foreground/90' : 'text-muted-foreground'
                  }`}>
                    {step.text}
                  </span>
                  
                  {/* Progress indicator for current step */}
                  {index === currentStep && !isFinished && (
                    <div className="w-full mt-1.5 h-0.5 bg-muted/60 rounded overflow-hidden">
                      <div className="h-full bg-primary animate-loadingBar"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom decorative element */}
        <div className="h-1 w-full bg-gradient-to-r from-primary/30 via-primary to-primary/30"></div>
      </div>
      
      {/* Add global styles for the animations */}
      <style jsx global>{`
        @keyframes loadingBar {
          0% { width: 0; }
          50% { width: 100%; }
          100% { width: 0; }
        }
        
        @keyframes fadeSlideIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-loadingBar {
          animation: loadingBar 2s ease-in-out infinite;
        }
        
        .animate-fadeSlideIn {
          animation: fadeSlideIn 0.5s ease-out forwards;
        }
        
        .scale-102 {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default Initializing;
