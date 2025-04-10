import React, { useState } from 'react';
import { 
  MessagesSquare, 
  Users, 
  Lightbulb, 
  HandshakeIcon,
  ArrowRight,
  Github,
  Twitter,
  Instagram,
  Heart,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BackgroundLines } from "@/components/ui/background-lines";

const LandingPage = () => {
  const [hoveredCard, setHoveredCard] = useState(null);

  const steps = [
    {
      icon: <Lightbulb className="w-12 h-12" />,
      title: "Share Your Ideas",
      description: "Post your project ideas and let the community discover them"
    },
    {
      icon: <Users className="w-12 h-12" />,
      title: "Find Collaborators",
      description: "Talented individuals can apply to join your project"
    },
    {
      icon: <HandshakeIcon className="w-12 h-12" />,
      title: "Connect",
      description: "Accept the perfect match and start collaborating"
    },
    {
      icon: <MessagesSquare className="w-12 h-12" />,
      title: "Start Creating",
      description: "Exchange contacts and bring your ideas to life"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="bg-background transition-colors duration-200">
      <BackgroundLines className="flex items-center justify-center w-full flex-col px-4 pointer-events-none">
        {/* Hero Section */}
        <div className="pointer-events-auto">
          <div className="container mx-auto px-4 ">
            <motion.div 
              className="container mx-auto px-4 pt-12 pb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.h1 
                className="text-6xl font-bold text-center mb-6 text-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Turn Ideas into Reality
              </motion.h1>
              <motion.p 
                className="text-xl text-center text-muted-foreground mb-12 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Connect with passionate collaborators and bring your projects to life. 
                Share your vision, find the perfect team, and start building together.
              </motion.p>
              <motion.div 
                className="flex justify-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <motion.button 
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Share Your Idea <ArrowRight className="w-5 h-5" />
                </motion.button>
                <motion.button 
                  className="border-2 border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary/10 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Browse Projects
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* How It Works Section */}
        <div>
          <div className="container mx-auto px-4">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-4 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {steps.map((step, index) => (
                <motion.div 
                  key={index}
                  variants={itemVariants}
                  onHoverStart={() => setHoveredCard(index)}
                  onHoverEnd={() => setHoveredCard(null)}
                  className="relative"
                >
                  <motion.div 
                    className="text-center p-6 rounded-xl bg-card text-card-foreground shadow-lg dark:shadow-primary/10"
                    whileHover={{ y: -10 }}
                    animate={{
                      scale: hoveredCard === index ? 1.05 : 1,
                    }}
                  >
                    <motion.div 
                      className="flex justify-center mb-4 text-primary"
                      animate={{ 
                        rotate: hoveredCard === index ? [0, -10, 10, 0] : 0 
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      {step.icon}
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {step.description}
                    </p>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Footer Section */}
        <motion.div
          className="w-full mt-auto pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-wrap items-center justify-center text-center pt-4">
              <span className="font-semibold text-primary">FindMyTeam</span>
              <span className="text-muted-foreground px-1">© Copyright {new Date().getFullYear()}</span>
              <span className="text-muted-foreground px-1">•</span>
              <a 
                href="https://priyanshagarwal.me/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-primary transition-colors px-1"
              >
                Priyansh Agarwal
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-center text-center">
              <span className="text-muted-foreground">Server time: {new Date().toLocaleString()}</span>
            </div>
          </div>
        </motion.div>
      </BackgroundLines>
    </div>
  );
};

export default LandingPage;