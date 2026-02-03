import React from 'react';
import { motion } from 'framer-motion';

interface BackgroundProps {
  mousePosition: { x: number; y: number };
}

const Background: React.FC<BackgroundProps> = ({ mousePosition }) => {
  return (
    <div className="fixed inset-0 z-0">
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(600px at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(74, 222, 128, 0.3), transparent 80%)`,
        }}
      />
      
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, #888 1px, transparent 1px),
                          linear-gradient(to bottom, #888 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />
      
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`back-star-${i}`}
          className="absolute rounded-full bg-gray-400"
          style={{
            width: `${1 + Math.random() * 1.5}px`,
            height: `${1 + Math.random() * 1.5}px`,
            boxShadow: `0 0 ${3 + Math.random() * 4}px ${1 + Math.random() * 1.5}px rgba(156, 163, 175, 0.6)`,
            filter: 'blur(0.3px)',
          }}
          initial={{
            x: Math.random() * 100 + 'vw',
            y: Math.random() * 100 + 'vh',
            opacity: 0.2 + Math.random() * 0.3,
          }}
          animate={{
            x: [
              `${(Math.random() * 100)}vw`,
              `${(Math.random() * 100)}vw`,
              `${(Math.random() * 100)}vw`
            ],
            y: [
              `${(Math.random() * 100)}vh`,
              `${(Math.random() * 100)}vh`,
              `${(Math.random() * 100)}vh`
            ],
            opacity: [
              0.3 + Math.random() * 0.4,
              0.6 + Math.random() * 0.3,
              0.3 + Math.random() * 0.4
            ],
          }}
          transition={{
            duration: 15 + Math.random() * 20,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.5, 1]
          }}
        />
      ))}
      
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`front-star-${i}`}
          className={`absolute rounded-full ${Math.random() > 0.5 ? 'bg-green-300' : 'bg-white'}`}
          style={{
            width: `${1.5 + Math.random() * 2}px`,
            height: `${1.5 + Math.random() * 2}px`,
            boxShadow: `0 0 ${4 + Math.random() * 5}px ${2 + Math.random() * 2}px currentColor`,
            filter: 'blur(0.8px)',
          }}
          initial={{
            x: Math.random() * 100 + 'vw',
            y: Math.random() * 100 + 'vh',
            opacity: 0.3 + Math.random() * 0.4,
          }}
          animate={{
            x: [
              `${(Math.random() * 100)}vw`,
              `${(Math.random() * 100)}vw`,
              `${(Math.random() * 100)}vw`
            ],
            y: [
              `${(Math.random() * 100)}vh`,
              `${(Math.random() * 100)}vh`,
              `${(Math.random() * 100)}vh`
            ],
            opacity: [
              0.2 + Math.random() * 0.3,
              0.7 + Math.random() * 0.3,
              0.2 + Math.random() * 0.3
            ],
          }}
          transition={{
            duration: 25 + Math.random() * 30,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.5, 1]
          }}
        />
      ))}
    </div>
  );
};

export default Background;