import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Heart, Sparkles,
  Award,
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
      description: "Veneta Tabakova-Komsalova is an Associate Professor at the Faculty of Mathematics and Informatics at Paisii Hilendarski University of Plovdiv. She defended her PhD dissertation in the field of Informatics at the same university. She collaborates with the Institute of Information and Communication Technologies at the Bulgarian Academy of Sciences. She has many years of pedagogical experience as a teacher and expert in secondary education. Her research interests include artificial intelligence, logic programming and Prolog programming, expert systems, and virtual-physical social spaces. She has authored more than 50 scientific articles and textbooks.",
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
      description: "Stanimir Stoyanov is a professor at the Faculty of Mathematics and Informatics at Paisii Hilendarski University of Plovdiv. He holds doctoral degrees from Humboldt University in Berlin, Germany, and De Montfort University in Leicester, United Kingdom. He collaborates with the Institute of Information and Communication Technologies at the Bulgarian Academy of Sciences. He has been a visiting professor at De Montfort University in Leicester, United Kingdom, and at Siberian Federal University in Krasnoyarsk, Russia. He has extensive practical experience in the development of information systems. His research interests include artificial intelligence, intelligent agents and multi-agent systems, virtual-physical social spaces, and logic programming. He has authored more than 300 scientific articles, books, and textbooks in Bulgarian, Russian, English, and German.",
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
      description: "Magdalena Maglizhanova is a PhD student at Paisii Hilendarski University of Plovdiv. She has 15 years of experience in software development and computer graphics design. Throughout her professional career, she has held various positions, including software tester, web designer, and print media designer. She worked for the American company Digital River, where she further developed her expertise in software testing. Prior to her current teaching position, she was employed as a print media designer in the PR department of the prestigious German company ATLAS. She is currently teaching Object-Oriented Programming at the Vocational High School of Electronics and Electrical Engineering in Plovdiv. Over the past year, she has actively participated in the development of the first STEM guide at her educational institution, in close collaboration with her colleagues.",
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
            We are a team from Plovdiv University that aims to support the smooth transition of education to modern technologies and digital solutions.
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
            
            <div>
             
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  <div>
    <h3 className="text-xl font-bold mb-4">What We Do</h3>
  <p className={`mb-4 ${currentTheme.subtitle}`}>
    We are an academic-driven team with strong expertise in artificial intelligence, logical programming, intelligent agents, and educational technologies. Our mission is to support the modernization of education through the meaningful integration of AI, software engineering, and STEM-oriented methodologies.
    <br /><br />
    We design and develop specialized software solutions for educational and research environments, including web and mobile applications, AI-powered systems, and knowledge-based platforms. Our work combines contemporary software engineering practices, logic-based artificial intelligence (including Prolog and expert systems), and user-centered design principles.
    <br /><br />
    By bridging research, practical software development, and classroom experience, we create solutions that enhance accessibility, adaptability, and effectiveness in both secondary and higher education.
  </p>
  </div>
  
  <div>
    <h3 className="text-xl font-bold mb-4">Our Story</h3>
  <p className={currentTheme.subtitle}>
    Our initiative brings together university researchers, experienced educators, and software development professionals. The team combines extensive academic research in artificial intelligence and multi-agent systems with long-standing pedagogical practice and industry experience in software development, testing, and digital design.
    <br /><br />
    Rooted in the academic environment of Paisii Hilendarski University of Plovdiv and enriched by collaboration with national and international institutions, our work integrates research excellence with real-world educational needs.
    <br /><br />
    Our long-term vision is to contribute to the transformation of Bulgarian education through AI-driven methodologies, STEM innovation, and the development of intelligent educational systems that support students, teachers, and institutions in the contemporary digital ecosystem.
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
      </div>
    </div>
  );
}