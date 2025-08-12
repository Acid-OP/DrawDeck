"use client";
import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  duration?: number; // milliseconds
  theme?: "light" | "dark";
}

export default function Toast({
  message,
  duration = 3000,
  theme = "light",
}: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const bgClass = theme === "dark" ? "bg-white text-black" : "bg-gray-900 text-white";

  return (
    <div
      className={`
        fixed bottom-5 right-5 z-50
        flex items-center gap-1 px-2 py-2 rounded-md shadow-lg
        transition-all duration-300 ease-in-out
        ${bgClass}
        ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}
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

      {/* Message text */}
      <span className="font-medium text-md">{message}</span>
    </div>
  );
}
