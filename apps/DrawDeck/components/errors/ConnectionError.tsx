import React from "react";

interface ConnectionErrorProps {
  error: string;
}

export const ConnectionError: React.FC<ConnectionErrorProps> = ({ error }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1f] via-[#232329] to-[#2a2a35] flex items-center justify-center p-3">
      <div className="bg-[#232329] text-white w-full max-w-sm p-6 rounded-xl shadow-xl border border-[#333] animate-in fade-in duration-300">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-5 bg-red-500/20 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">!</span>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-2 text-red-400">
            Connection Failed
          </h2>

          <p className="text-white/80 text-sm leading-relaxed mb-5">
            {error}
          </p>

          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 mb-6">
            <p className="text-xs text-red-300 leading-relaxed">
              <span className="font-medium">Tip:</span> Check your internet connection and try again.
              If the problem persists, the server might be temporarily unavailable.
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-500 text-white cursor-pointer px-5 py-2.5 rounded-md hover:bg-red-600 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-red-500/25 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Retry Connection
          </button>
        </div>
      </div>
    </div>
  );
};
