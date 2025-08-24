import React from "react";

interface RoomConnectingProps {
  slug: string;
  roomType?: "duo" | "group";
}

export const RoomConnecting: React.FC<RoomConnectingProps> = ({ slug, roomType }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1f] via-[#232329] to-[#2a2a35] flex items-center justify-center p-3">
      <div className="bg-[#232329] text-white w-full max-w-sm p-6 rounded-xl shadow-xl border border-[#333] animate-in fade-in duration-300">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-5 relative">
            <div className="absolute inset-0 bg-[#9e9aea]/20 rounded-full"></div>
            <div className="absolute inset-1.5 border-[3px] border-transparent border-t-[#9e9aea] rounded-full animate-spin"></div>
            <div className="absolute inset-3 bg-[#9e9aea]/30 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-[#9e9aea] rounded-full animate-pulse"></div>
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#9e9aea" }}>
            Connecting to Room
          </h2>

          <p className="text-white/80 text-sm leading-relaxed mb-1">
            Joining "{slug}"...
          </p>

          <p className="text-white/60 text-xs mb-5">
            Establishing secure connection...
          </p>
          {roomType && (
            <div className="bg-[#9e9aea]/10 border border-[#9e9aea]/20 rounded-md p-3 mb-5">
              <div className="flex items-center justify-center gap-2 text-[#9e9aea] text-sm">
                <span className="text-base">
                  {roomType === "duo" ? "👥" : "👨‍👩‍👧‍👦"}
                </span>
                <span className="font-medium">
                  {roomType === "duo" ? "Duo Room (Max 2 people)" : "Group Room (Unlimited)"}
                </span>
              </div>
            </div>
          )}
          <div className="space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-white/70">Connecting to server...</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
              <span className="text-white/50">Authenticating room access...</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
              <span className="text-white/50">Loading canvas...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
