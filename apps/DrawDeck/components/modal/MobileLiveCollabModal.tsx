"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Monitor, Smartphone } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface MobileRestrictionModalProps {
  onClose: () => void;
  source?: "header" | "sidebar" | "share";
}

export const MobileRestrictionModal: React.FC<MobileRestrictionModalProps> = ({
  onClose,
  source = "header",
}) => {
  const { theme } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const isCompact = source === "sidebar" || source === "share";

  const handleClose = () => {
    onClose();
  };

  // Detect mobile or tablet
  useEffect(() => {
    const checkScreen = () => {
      setIsMobileOrTablet(window.innerWidth < 1024);
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isMobileOrTablet) return null; // Don't render on desktop

  const modalContent = (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/40 backdrop-blur-md p-4">
      <div
        ref={modalRef}
        className={`relative rounded-2xl shadow-2xl text-center border w-full transform transition-all duration-300 scale-100 ${
          isCompact
            ? "max-w-[85vw] sm:max-w-[380px] p-5"
            : "max-w-[85vw] sm:max-w-[400px] p-6"
        } hover:shadow-3xl ${
          theme === "dark"
            ? "bg-[#232329] text-white border-[#333]/60"
            : "bg-white text-black border-gray-200"
        }`}
        style={{
          boxShadow:
            theme === "dark"
              ? "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(158, 154, 234, 0.1)"
              : "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(158, 154, 234, 0.1)",
          maxHeight: "85vh",
          minHeight: "fit-content",
        }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="relative p-2.5 bg-gradient-to-br from-[#9e9aea]/20 to-[#9e9aea]/10 rounded-2xl border border-[#9e9aea]/20">
            <Monitor size={28} className="text-[#9e9aea]" />
            <div
              className={`absolute -bottom-1 -right-1 rounded-full p-1.5 border ${
                theme === "dark"
                  ? "bg-[#232329] border-[#333]"
                  : "bg-white border-gray-300"
              }`}
            >
              <Smartphone size={12} className="text-red-400" />
            </div>
          </div>
        </div>

        <h2
          className={`font-bold mb-3 ${
            isCompact ? "text-lg" : "text-xl"
          } bg-gradient-to-r from-[#9e9aea] to-[#bbb8ff] bg-clip-text text-transparent`}
        >
          Desktop Required
        </h2>

        <p
          className={`font-light leading-relaxed ${
            isCompact ? "text-xs mb-4" : "text-sm mb-5"
          } ${theme === "dark" ? "text-white/70" : "text-black/70"}`}
        >
          Live collaboration requires a desktop computer for optimal
          performance and video calling features.
        </p>

        <div
          className={`bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-700/30 rounded-xl text-blue-200 text-left backdrop-blur-sm ${
            isCompact ? "mb-4 p-3" : "mb-5 p-4"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-blue-500/20 rounded-lg">
              <Monitor size={14} className="text-blue-400" />
            </div>
            <div>
              <div
                className={`font-semibold mb-1.5 text-blue-100 ${
                  isCompact ? "text-xs" : "text-sm"
                }`}
              >
                Why desktop only?
              </div>
              <div
                className={`leading-relaxed text-blue-200/80 space-y-0.5 ${
                  isCompact ? "text-[10px]" : "text-xs"
                }`}
              >
                <div>• Optimal performance for real-time collaboration</div>
                <div>• Better support for video calling features</div>
                <div>• Enhanced drawing precision with mouse/trackpad</div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleClose}
          className={`w-full bg-gradient-to-r from-[#a8a5ff] to-[#bbb8ff] text-black font-semibold rounded-xl flex items-center justify-center gap-2 mx-auto transition-all duration-200 cursor-pointer hover:from-[#bbb8ff] hover:to-[#ccc9ff] hover:shadow-lg hover:shadow-[#9e9aea]/25 active:scale-[0.98] ${
            isCompact ? "py-3 px-5" : "py-3.5 px-6"
          }`}
        >
          <span
            className={`font-semibold ${isCompact ? "text-xs" : "text-sm"}`}
          >
            Got it
          </span>
        </button>
      </div>
    </div>
  );

  return typeof window !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};
