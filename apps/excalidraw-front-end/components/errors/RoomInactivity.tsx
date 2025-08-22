import React from "react";
import { useRouter } from 'next/navigation';

interface RoomInactivityProps {
  message: string;
  idleTime: number;
  roomId: string;
}

export const RoomInactivityModal: React.FC<RoomInactivityProps> = ({ 
  message, 
  idleTime, 
  roomId 
}) => {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1f] via-[#232329] to-[#2a2a35] flex items-center justify-center p-3">
      <div className="bg-[#232329] text-white w-full max-w-sm p-6 rounded-xl shadow-xl border border-[#333] animate-in fade-in duration-300">
        <div className="text-center">
          {/* Clock/Timer Icon */}
          <div className="w-12 h-12 mx-auto mb-5 bg-orange-500/20 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-2 text-orange-400">
            Room Closed - Inactivity
          </h2>

          <p className="text-white/80 text-sm leading-relaxed mb-4">
            {message}
          </p>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-md p-3 mb-6">
            <p className="text-xs text-orange-300 leading-relaxed">
              🎨 <span className="font-medium">Room #{roomId}</span> was inactive for {idleTime} minutes.
              <br />
              Start a new session to continue drawing!
            </p>
          </div>

          <button
            onClick={handleGoHome}
            className="w-full bg-orange-500 text-white cursor-pointer px-5 py-2.5 rounded-md hover:bg-orange-600 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-orange-500/25 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Go to Home Page
          </button>
        </div>
      </div>
    </div>
  );
};