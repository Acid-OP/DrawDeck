"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Keyboard } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: "Tools",
      shortcuts: [
        { keys: ["1"], description: "Hand tool" },
        { keys: ["2"], description: "Select tool" },
        { keys: ["3"], description: "Rectangle" },
        { keys: ["4"], description: "Diamond" },
        { keys: ["5"], description: "Circle" },
        { keys: ["6"], description: "Arrow" },
        { keys: ["7"], description: "Line" },
        { keys: ["8"], description: "Pencil" },
        { keys: ["9"], description: "Text" },
        { keys: ["0"], description: "Eraser" },
      ],
    },
    {
      title: "Edit",
      shortcuts: [
        { keys: ["Ctrl", "Z"], description: "Undo" },
        { keys: ["Ctrl", "Y"], description: "Redo" },
        { keys: ["Ctrl", "C"], description: "Copy selected" },
        { keys: ["Ctrl", "V"], description: "Paste" },
        { keys: ["Ctrl", "D"], description: "Duplicate" },
        { keys: ["Del"], description: "Delete selected" },
      ],
    },
    {
      title: "View",
      shortcuts: [
        { keys: ["Ctrl", "+"], description: "Zoom in" },
        { keys: ["Ctrl", "-"], description: "Zoom out" },
        { keys: ["Ctrl", "0"], description: "Reset zoom" },
      ],
    },
    {
      title: "Help",
      shortcuts: [
        { keys: ["?"], description: "Keyboard shortcuts" },
      ],
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const KeyBadge: React.FC<{ keyName: string }> = ({ keyName }) => (
    <kbd
      className={`px-2 py-1 rounded text-xs font-mono font-semibold border ${
        theme === "dark"
          ? "bg-[#1a1a1f] text-[#9e9aea] border-[#444]"
          : "bg-gray-100 text-[#6b5dd3] border-gray-300"
      }`}
    >
      {keyName}
    </kbd>
  );

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm">
      <div
        ref={modalRef}
        className={`relative rounded-2xl border transform transition-all duration-300 scale-100 w-[520px] max-w-[90vw] max-h-[85vh] overflow-hidden ${
          theme === "dark" ? "bg-[#232329] text-white border-[#333]/60" : "bg-white text-black border-gray-200"
        }`}
        style={{
          boxShadow:
            theme === "dark"
              ? "0 25px 50px -12px rgba(0,0,0,0.5)"
              : "0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(158,154,234,0.1)",
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-inherit z-10 px-8 pt-8 pb-4 border-b border-[#333]/20">
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 transition-colors ${
              theme === "dark" ? "text-white/70 hover:text-white" : "text-black/70 hover:text-black"
            }`}
          >
            <X size={20} />
          </button>

          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-[#9e9aea]/20 to-[#9e9aea]/10 rounded-lg border border-[#9e9aea]/20">
              <Keyboard size={20} className="text-[#9e9aea]" />
            </div>
            <h2 className="font-bold text-xl bg-gradient-to-r from-[#9e9aea] to-[#bbb8ff] bg-clip-text text-transparent">
              Keyboard Shortcuts
            </h2>
          </div>
          
          <p
            className={`text-center font-light text-sm ${
              theme === "dark" ? "text-white/60" : "text-black/60"
            }`}
          >
            Speed up your workflow with these shortcuts
          </p>
        </div>

        {/* Shortcuts Grid */}
        <div className="overflow-y-auto px-8 py-6 max-h-[calc(85vh-140px)]">
          <div className="grid grid-cols-2 gap-6">
            {shortcutGroups.map((group, groupIndex) => (
              <div key={groupIndex} className={groupIndex >= 2 ? "col-span-2" : ""}>
                <h3
                  className={`text-sm font-semibold mb-3 ${
                    theme === "dark" ? "text-white/80" : "text-black/80"
                  }`}
                >
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                        theme === "dark" ? "hover:bg-[#2a2a30]" : "hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`text-sm ${
                          theme === "dark" ? "text-white/70" : "text-black/70"
                        }`}
                      >
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            {keyIndex > 0 && (
                              <span
                                className={`text-xs mx-1 ${
                                  theme === "dark" ? "text-white/40" : "text-black/40"
                                }`}
                              >
                                +
                              </span>
                            )}
                            <KeyBadge keyName={key} />
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 bg-inherit px-8 py-4 border-t ${
          theme === "dark" ? "border-[#333]/20" : "border-gray-200"
        }`}>
          <p className={`text-xs text-center ${
            theme === "dark" ? "text-white/50" : "text-black/50"
          }`}>
            Press <kbd className="px-1.5 py-0.5 rounded text-xs font-mono bg-[#9e9aea]/20 text-[#9e9aea]">?</kbd> anytime to view shortcuts
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

