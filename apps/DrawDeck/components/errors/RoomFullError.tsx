import React from "react";

interface RoomFullErrorProps {
  error: {
    message: string;
    currentCount: number;
    maxCapacity: number;
  };
  slug: string;
  roomType?: "duo" | "group";
  handleGoBack: () => void;
  handleTryAgain: () => void;
}

export const RoomFullError: React.FC<RoomFullErrorProps> = ({
  error,
  slug,
  roomType,
  handleGoBack,
  handleTryAgain,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1f] via-[#232329] to-[#2a2a35] flex items-center justify-center p-3">
      <div className="bg-[#232329] text-white w-full max-w-md p-6 rounded-xl shadow-xl border border-[#333] animate-in fade-in duration-300">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-orange-500/20 rounded-full flex items-center justify-center">
            <div className="w-10 h-10 bg-orange-500/30 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-orange-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-3 text-orange-400">
            Room is Full
          </h2>

          <p className="text-white/80 text-base leading-relaxed mb-4">
            {error.message}
          </p>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-2xl">
                {roomType === "duo" ? "👥" : "👨‍👩‍👧‍👦"}
              </span>
              <div className="text-left">
                <p className="text-orange-300 font-medium text-sm">
                  {roomType === "duo" ? "Duo Room" : "Group Room"}
                </p>
                <p className="text-white/70 text-xs">Room: "{slug}"</p>
              </div>
            </div>

            <div className="flex justify-center items-center gap-4 text-sm">
              <div className="bg-white/10 rounded-lg px-3 py-2">
                <p className="text-white/60 text-xs">Current</p>
                <p className="text-white font-bold text-lg">
                  {error.currentCount}
                </p>
              </div>
              <div className="text-white/40">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="bg-orange-500/20 rounded-lg px-3 py-2">
                <p className="text-orange-300 text-xs">Maximum</p>
                <p className="text-orange-400 font-bold text-lg">
                  {error.maxCapacity}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3 mb-6">
            <p className="text-xs text-blue-300 leading-relaxed">
              <span className="font-medium">Suggestion:</span>
              {roomType === "duo"
                ? " Wait for someone to leave or create a new duo room."
                : " Try creating a new group room or wait for participants to leave."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGoBack}
              className="flex-1 bg-gray-600 text-white cursor-pointer px-4 py-2.5 rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 text-sm"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Go Back
            </button>

            <button
              onClick={handleTryAgain}
              className="flex-1 bg-orange-500 text-white cursor-pointer px-4 py-2.5 rounded-lg hover:bg-orange-600 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-orange-500/25 text-sm"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
