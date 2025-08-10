import React from "react";

interface CreatorLeftErrorProps {
  slug: string;
  onGoBack: () => void;
}

export const CreatorLeftError: React.FC<CreatorLeftErrorProps> = ({ slug, onGoBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1f] via-[#232329] to-[#2a2a35] flex items-center justify-center p-3">
      <div className="bg-[#232329] text-white w-full max-w-md p-6 rounded-xl shadow-xl border border-[#333] animate-in fade-in duration-300">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-5 relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full"></div>
            <div className="absolute inset-2 bg-red-500/30 rounded-full flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-red-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-3 text-red-400">
            Room Creator Left
          </h2>

          <p className="text-white/80 text-sm leading-relaxed mb-2">
            The creator of room "{slug}" has left.
          </p>

          <p className="text-white/60 text-xs mb-6">
            This room is no longer accessible and has been closed.
          </p>
          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 mb-6">
            <div className="flex items-start gap-3 text-left">
              <span className="text-red-400 text-lg mt-0.5">ℹ️</span>
              <div>
                <p className="text-red-300 text-sm font-medium mb-1">
                  What happened?
                </p>
                <p className="text-white/70 text-xs leading-relaxed">
                  When a room creator leaves, the room becomes inaccessible to maintain security and prevent abandoned sessions.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={onGoBack}
              className="w-full bg-[#9e9aea] cursor-pointer hover:bg-[#8a8ad6] text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Return to Home
            </button>

            <p className="text-white/50 text-xs text-center">
              You can create a new room or join an existing one from the home page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};