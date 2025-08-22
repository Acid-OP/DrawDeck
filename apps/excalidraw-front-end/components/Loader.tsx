"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Responsive sizing function
const getResponsiveSizes = () => {
  if (typeof window === 'undefined') {
    // Default to desktop to prevent jumping on desktop
    return { ballSize: 48, spacing: 75, diamondMove: 15, otherMove: 38 };
  }
  
  const width = window.innerWidth;
  
if (width >= 1024) {
  return { ballSize: 54, spacing: 84, diamondMove: 15, otherMove: 38 }; // +8
} else if (width >= 768) {
  return { ballSize: 46, spacing: 71, diamondMove: 12, otherMove: 31 }; // +7
} else if (width >= 480) {
  return { ballSize: 38, spacing: 68, diamondMove: 10, otherMove: 25 }; // +6
} else {
  return { ballSize: 34, spacing: 52, diamondMove: 9, otherMove: 22 }; // +6
}


};

const LoaderAnimation = () => {
  const [step, setStep] = useState<"blue-gray" | "blue-purple" | "done">("blue-gray");
  const [sizes, setSizes] = useState(() => getResponsiveSizes());
  const [isClient, setIsClient] = useState(false);

  const [positions, setPositions] = useState({
    blue: 0,
    gray: 1,
    purple: 2,
  });

  const getX = (index: number) => {
    return index * sizes.spacing;
  };

  useEffect(() => {
    setIsClient(true);
    const updateSizes = () => {
      setSizes(getResponsiveSizes());
    };

    updateSizes();
    window.addEventListener('resize', updateSizes);
    
    return () => window.removeEventListener('resize', updateSizes);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const timeout = setTimeout(() => {
      if (step === "blue-gray") {
        setPositions((prev) => ({
          ...prev,
          blue: 1,
          gray: 0,
        }));
        setStep("blue-purple");
      } else if (step === "blue-purple") {
        setPositions((prev) => ({
          ...prev,
          blue: 2,
          purple: 1,
        }));
        setStep("done");
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [step, isClient]);

  if (!isClient) {
    return (
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "white",
        }}
      />
    );
  }

  const IconWrapper = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        width: sizes.ballSize,
        height: sizes.ballSize,
        position: "absolute",
      }}
    >
      {children}
    </div>
  );

  const GreenSquare = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 640"
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <path
        fill="#55e76e"
        stroke="black"
        strokeWidth="8"
        d="M160 96L480 96C515.3 96 544 124.7 544 160L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 160C96 124.7 124.7 96 160 96z"
      />
    </svg>
  );

  const YellowDiamond = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 640"
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <path
        fill="#f9d144"
        stroke="black"
        strokeWidth="8"
        d="M81 279L279 81C289.9 70.1 304.6 64 320 64C335.4 64 350.1 70.1 361 81L559 279C569.9 289.9 576 304.6 576 320C576 335.4 569.9 350.1 559 361L361 559C350.1 569.9 335.4 576 320 576C304.6 576 289.9 569.9 279 559L81 361C70.1 350.1 64 335.4 64 320C64 304.6 70.1 289.9 81 279z"
      />
    </svg>
  );

  const RedCircle = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 640"
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <path
        fill="#ff7d7d"
        stroke="black"
        strokeWidth="8"
        d="M64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320z"
      />
    </svg>
  );

  const renderBall = (
    key: string,
    index: number,
    type: "square" | "diamond" | "circle"
  ) => {
    const Icon =
      type === "square"
        ? GreenSquare
        : type === "diamond"
        ? YellowDiamond
        : RedCircle;

    return (
      <motion.div
        key={key}
        initial={false}
        animate={{
          x: getX(index),
          y: type === "diamond" ? [0, sizes.diamondMove, sizes.diamondMove, 0] : [0, -sizes.otherMove, -sizes.otherMove, 0],
        }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{
          width: sizes.ballSize,
          height: sizes.ballSize,
          position: "absolute",
        }}
      >
        <IconWrapper>
          <Icon />
        </IconWrapper>
      </motion.div>
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "white",
        overflow: "hidden",
      }}
    >
      <div 
        style={{ 
          position: "relative", 
          width: sizes.spacing * 2, 
          height: sizes.ballSize * 2,
           left: window.innerWidth <= 430 ? -20 : -(sizes.spacing),
        }}
      >
        <AnimatePresence>
          {renderBall("blue", positions.blue, "square")}
          {renderBall("gray", positions.gray, "diamond")}
          {renderBall("purple", positions.purple, "circle")}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LoaderAnimation;