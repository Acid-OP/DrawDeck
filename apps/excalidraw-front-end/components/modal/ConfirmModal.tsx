"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";

interface ConfirmModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  setOpen,
  onConfirm,
}) => {
  const { theme } = useTheme();
  const handleCancel = () => setOpen(false);

  // Button styles
  const confirmBtnStyles =
    theme === "dark"
      ? "bg-[#ffa8a5] text-black cursor-pointer"
      : "bg-[#db6965] text-white cursor-pointer";
  const cancelBtnStyles =
    theme === "dark"
      ? "bg-[#232329] text-[#c1c1c6] border-none cursor-pointer"
      : "bg-white text-black border border-gray-300 cursor-pointer";
  const modalBg = theme === "dark" ? "bg-[#232329]" : "bg-[#ffffff]";

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      ></div>

      {/* Modal content */}
      <div
        className={`relative z-10 sm:max-w-[320px] min-w-[300px] py-6 px-5 rounded-xl ${modalBg} flex flex-col items-center border-none shadow-lg`}
      >
        {/* Header */}
        <div className="space-y-3 w-full text-center">
          <h2
            className={`text-lg font-bold ${
              theme === "dark" ? "text-white" : "text-black"
            }`}
          >
            Clear Canvas
          </h2>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-[#ededed]" : "text-gray-800"
            }`}
          >
            Do you really want to clear the canvas? This cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-row gap-4 justify-center w-full mt-6">
          <button
            className={`flex-1 py-3 rounded-lg text-base font-semibold transition-colors duration-150 ${cancelBtnStyles}`}
            style={{ minWidth: 95, minHeight: 42 }}
            onClick={handleCancel}
            type="button"
          >
            No
          </button>
          <button
            className={`flex-1 py-3 rounded-lg text-base font-semibold flex items-center gap-2 justify-center transition-colors duration-150 ${confirmBtnStyles}`}
            style={{ minWidth: 95, minHeight: 42 }}
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
            type="button"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};
