import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Heart, Sparkles,
  Award,  Rocket,
  Linkedin, Github, Twitter, Mail
} from 'lucide-react';
import { useTheme } from "../context/ThemeContext";

interface TeamMember {
  id: number;
  name: string;
  role: string;
  description: string;
  image: string; // pic1, pic2, pic3 ще бъдат подадени като props
  social: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    email?: string;
  };
  skills: string[];
}

interface CompanyValue {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function AboutUs({ 
  pic1, 
  pic2, 
  pic3 
}: { 
  pic1: string; 
  pic2: string; 
  pic3: string; 
}) {
  const { theme } = useTheme();

  // Тематични класове
  const themeClasses = {
    light: {
      background: "bg-gradient-to-b from-gray-50 to-white",
      card: "bg-white border-gray-200",
      text: "text-gray-900",
      subtitle: "text-gray-600",
      hover: "hover:bg-gray-100",
      accent: "text-blue-600",
      gradient: "from-blue-500 to-cyan-500"
    },
    dark: {
      background: "bg-gradient-to-b from-gray-900 to-gray-800",
      card: "bg-gray-800 border-gray-700",
      text: "text-white",
      subtitle: "text-gray-300",
      hover: "hover:bg-gray-700",
      accent: "text-cyan-400",
      gradient: "from-blue-500 to-cyan-500"
    }
  };

  const currentTheme = themeClasses[theme];

  // Данни за екипа (използвайки подадените снимки)
  const teamMembers: TeamMember[] = [
    {
      id: 1,
      name: "Veneta Tabakova-Komsalova",
      role: "Associate Professor & Team Leader",
      description: "With over 15 years of experience in software development, Veneta Tabakova-Komsalova leads our technical vision. Passionate about creating elegant solutions to complex problems.",
      image: pic1,
      social: {
        linkedin: "https://linkedin.com/in/alexjohnson",
        github: "https://github.com/alexjohnson",
        twitter: "https://twitter.com/alexj_dev"
      },
      skills: ["Prolog", "C#"]
    },
    {
      id: 2,
      name: "Stanimir Stoqnov",
      role: "Professor & Symbolic AI systems",
      description: "Stoyanov develops intelligent systems with a strong focus on user-centered design and logical programming principles. He works in the fields of artificial intelligence and knowledge-based systems.",
      image: pic2,
      social: {
        linkedin: "https://linkedin.com/in/mariachen",
        github: "https://github.com/mariadesign",
        twitter: "https://twitter.com/maria_ux"
      },
      skills: ["Prolog", "C#"]
    },
    {
      id: 3,
      name: "Magdalena Maglizhanova",
      role: "Full-Stack Developer & Doctoral Student",
      description: "Magdalena builds robust backend systems. Her expertise in database design and API development keeps the platform running smoothly.",
      image: pic3,
      social: {
        linkedin: "https://linkedin.com/in/davidsmith",
        github: "https://github.com/dsmithdev",
        email: "david@example.com"
      },
      skills: ["React", "TypeScript", "Node.js", "Prolog"]
    }
  ];

  // Ценности на компанията
  const companyValues: CompanyValue[] = [
    {
      id: 1,
      title: "Innovation",
      description: "We constantly explore new technologies and approaches to deliver cutting-edge solutions.",
      icon: <Sparkles className="w-6 h-6" />
    },
    {
      id: 2,
      title: "Collaboration",
      description: "Great things happen when diverse minds come together. We believe in teamwork and open communication.",
      icon: <Users className="w-6 h-6" />
    },
    {
      id: 3,
      title: "Excellence",
      description: "We strive for excellence in everything we do, from code quality to customer support.",
      icon: <Award className="w-6 h-6" />
    },
    {
      id: 4,
      title: "Impact",
      description: "Our goal is to create technology that makes a positive difference in people's lives.",
      icon: <Heart className="w-6 h-6" />
    }
  ];


  return (
    <div className={`min-h-screen pt-20 ${currentTheme.background}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero секция */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20' 
                : 'bg-gradient-to-br from-blue-100 to-cyan-100'
            }`}>
              <Users className={`w-8 h-8 ${
                theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                About Us
              </h1>
              <p className={`text-lg mt-2 ${currentTheme.subtitle}`}>
                Meet the team behind our success
              </p>
            </div>
          </div>
          
          <p className={`text-xl max-w-3xl mx-auto ${currentTheme.subtitle}`}>
            We are a passionate team of developers, designers, and innovators dedicated to creating exceptional digital experiences. 
            Our mission is to build technology that empowers people and businesses to achieve more.
          </p>
        </motion.div>
        {/* Нашата мисия */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`mb-16 p-8 rounded-2xl border ${currentTheme.card}`}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              theme === 'dark' 
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20' 
                : 'bg-gradient-to-r from-purple-100 to-pink-100'
            }`}>
              <Rocket className={`w-6 h-6 ${
                theme === 'dark' ? 'text-pink-400' : 'text-purple-600'
              }`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Our Mission</h2>
              <p className={currentTheme.subtitle}>
                To revolutionize the way people interact with technology and education through innovative, human-centered, and AI-driven solutions.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">What We Do</h3>
              <p className={`mb-4 ${currentTheme.subtitle}`}>
                We specialize in creating custom software solutions — from web and mobile applications to complex enterprise and AI-powered systems. Our approach combines cutting-edge technology, logical and knowledge-based artificial intelligence, and user-centered design.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-4">Our Story</h3>
              <p className={currentTheme.subtitle}>
                Founded in 2024, we began as a small team. Today, we are a growing and diverse team of professionals working at the intersection of software engineering, artificial intelligence, and education.
Our core mission is to transform Bulgarian education by integrating modern technologies and AI-driven methodologies, helping learners, educators, and institutions adapt to the rapidly evolving digital world.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Нашият екип */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
            <p className={`text-lg max-w-2xl mx-auto ${currentTheme.subtitle}`}>
              The talented individuals who make everything possible
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, idx) => (
              <motion.div
                key={member.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={`rounded-2xl border overflow-hidden ${currentTheme.card} group hover:shadow-xl transition-shadow duration-300`}
              >
                {/* Снимка на член на екипа */}
                <div className="h-64 overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                
                {/* Информация */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold">{member.name}</h3>
                    <p className={`text-sm ${currentTheme.accent} font-medium`}>{member.role}</p>
                  </div>
                  
                  <p className={`mb-4 text-sm ${currentTheme.subtitle}`}>
                    {member.description}
                  </p>
                  
                  {/* Умения */}
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {member.skills.map((skill) => (
                        <span
                          key={skill}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            theme === 'dark' 
                              ? 'bg-blue-900/50 text-blue-300' 
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Социални мрежи */}
                  <div className="flex gap-3">
                    {member.social.linkedin && (
                      <a 
                        href={member.social.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 rounded-lg ${currentTheme.hover} transition-colors`}
                        aria-label={`${member.name}'s LinkedIn`}
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {member.social.github && (
                      <a 
                        href={member.social.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 rounded-lg ${currentTheme.hover} transition-colors`}
                        aria-label={`${member.name}'s GitHub`}
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {member.social.twitter && (
                      <a 
                        href={member.social.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 rounded-lg ${currentTheme.hover} transition-colors`}
                        aria-label={`${member.name}'s Twitter`}
                      >
                        <Twitter className="w-4 h-4" />
                      </a>
                    )}
                    {member.social.email && (
                      <a 
                        href={`mailto:${member.social.email}`}
                        className={`p-2 rounded-lg ${currentTheme.hover} transition-colors`}
                        aria-label={`Email ${member.name}`}
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Нашите ценности */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className={`text-lg max-w-2xl mx-auto ${currentTheme.subtitle}`}>
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {companyValues.map((value, idx) => (
              <motion.div
                key={value.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={`rounded-2xl p-6 border ${currentTheme.card} ${currentTheme.hover} transition-all duration-300`}
              >
                <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20' 
                    : 'bg-gradient-to-r from-blue-100 to-cyan-100'
                }`}>
                  <div className={theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}>
                    {value.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className={currentTheme.subtitle}>{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Присъединете се към нас */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`text-center p-8 rounded-2xl border ${currentTheme.card} bg-gradient-to-r ${currentTheme.gradient}/5`}
        >
          <h2 className="text-3xl font-bold mb-4">Want to Join Our Team?</h2>
          <p className={`text-xl mb-8 max-w-2xl mx-auto ${currentTheme.subtitle}`}>
            We're always looking for talented individuals who share our passion for innovation and excellence.
          </p>
          <button className={`px-8 py-3 rounded-xl font-medium transition-all ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-cyan-500/25'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg'
          }`}>
            View Open Positions
          </button>
        </motion.div>
      </div>
    </div>
  );
}