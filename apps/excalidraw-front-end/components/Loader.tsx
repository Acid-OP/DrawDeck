import React from 'react';
import { motion } from 'framer-motion';

export const LoadingScreen: React.FC = () => {
  // Animation for the circles
  const getCircleAnimation = (delay: number) => ({
    scale: [1, 1.2, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      delay,
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  });

  // Container animation for the circular motion
  const containerAnimation = {
    rotate: 360,
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "linear" as const
    }
  };

  // Individual circle positions and animations
  const circlePositions = [
    { x: 0, y: -40, color: "#3B82F6", delay: 0 },     // Blue - Top
    { x: -35, y: 20, color: "#EF4444", delay: 0.5 },  // Red - Bottom Left  
    { x: 35, y: 20, color: "#10B981", delay: 1 }      // Green - Bottom Right
  ];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-8">
        
        {/* Main animated container */}
        <motion.div
          className="relative w-32 h-32 flex items-center justify-center"
          animate={containerAnimation}
        >
          {circlePositions.map((circle, index) => (
            <motion.div
              key={index}
              className="absolute w-6 h-6 rounded-full shadow-lg"
              style={{
                backgroundColor: circle.color,
                x: circle.x,
                y: circle.y,
              }}
              initial={{ scale: 1, opacity: 0.7 }}
              animate={getCircleAnimation(circle.delay)}
            />
          ))}
          
          {/* Center dot for reference */}
          <motion.div 
            className="w-2 h-2 bg-gray-400 rounded-full opacity-30"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Loading text with staggered animation */}
        <motion.div 
          className="flex flex-col items-center space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <motion.h2 
            className="text-xl font-semibold text-gray-700"
            animate={{
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            Loading Canvas
          </motion.h2>
          
          {/* Animated dots */}
          <div className="flex space-x-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-gray-500 rounded-full"
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Progress indicator */}
        <motion.div 
          className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 192 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 via-red-500 to-green-500 rounded-full"
            animate={{
              x: [-192, 192],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Subtle background animation */}
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at center, rgba(59, 130, 246, 0.03) 0%, transparent 70%)"
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    </div>
  );
};