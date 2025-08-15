"use client";
import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  duration?: number;
  theme?: "light" | "dark";
}

export default function Toast({
  message,
  duration = 3000,
  theme,
}: ToastProps) {
  const [phase, setPhase] = useState<'entering' | 'visible' | 'exiting'>('entering');

  useEffect(() => {
    setPhase('entering');
    
    const showTimer = setTimeout(() => {
      setPhase('visible');
    }, 300); 
    
    const hideTimer = setTimeout(() => {
      setPhase('exiting');
    }, 1300); 
    
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const bgClass =
    theme === "light"
      ? "bg-gray-900 text-white"
      : "bg-white text-black";  
      
  const getAnimationClass = () => {
    switch (phase) {
      case 'entering':
        return "translate-y-6 opacity-0"; 
      case 'visible':
        return "translate-y-0 opacity-100"; 
      case 'exiting':
        return "translate-y-6 opacity-100"; 
      default:
        return "translate-y-6 opacity-0";
    }
  };

  return (
    <div
      className={`
        fixed bottom-5 right-5 z-50
        flex items-center gap-1 px-2 py-2 rounded-md shadow-lg
        transition-all duration-300 ease-in-out
        ${bgClass}
        ${getAnimationClass()}
      `}
      style={{ minWidth: 220, maxWidth: 320 }}
      role="alert"
      aria-live="assertive"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#a8a5ff"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
      <span className="font-medium text-md">{message}</span>
    </div>
  );
}