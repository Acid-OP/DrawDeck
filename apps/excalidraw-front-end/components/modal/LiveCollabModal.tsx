"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Play, Users, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { generateRoomId } from "@/lib/generateRoomId";
import { generateSecureKey } from "@/lib/crypto";
import { MobileRestrictionModal } from "./MobileLiveCollabModal";
import { useTheme } from "@/context/ThemeContext";
import { useSession } from "next-auth/react";

interface Props {
  onClose: () => void;
  source?: "header" | "sidebar" | "share";
}

type RoomType = "duo" | "group";

export const LiveCollabModal: React.FC<Props> = ({
  onClose,
  source = "header",
}) => {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const checkDevice = () => setIsMobile(window.innerWidth < 1024);
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  if (isMobile === null) return null;
  if (isMobile) return <MobileRestrictionModal onClose={onClose} source={source} />;

  return <DesktopCollabModal onClose={onClose} source={source} />;
};

const DesktopCollabModal: React.FC<Props> = ({ onClose, source = "header" }) => {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
   const { status } = useSession();
  const isSignedIn = status === "authenticated";

  const [selectedRoomType, setSelectedRoomType] = useState<RoomType>("duo");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCompact = source === "sidebar" || source === "share";

  const handleStartSession = async () => {
    if (!isSignedIn) {
      router.push("/signin");
      return;
    }

    setIsLoading(true);
    try {
      const encryptionKey = await generateSecureKey();
      const roomId = generateRoomId();
      sessionStorage.setItem(`creator-${roomId}`, "true");
      onClose();
      router.push(`/${roomId}?key=${encryptionKey}&type=${selectedRoomType}`);
    } catch (err) {
      console.error("Error starting session:", err);
      setError("Failed to start session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => onClose();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && e.target instanceof Node && !modalRef.current.contains(e.target)) {
        handleClose();
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm" data-modal="true">
      <div
        ref={modalRef}
        className={`relative rounded-2xl text-center border transform transition-all duration-300 scale-100 ${
          isCompact ? "w-[460px] p-7" : "w-[490px] p-8"
        } hover:shadow-3xl ${
          theme === "dark" ? "bg-[#232329] text-white border-[#333]/60" : "bg-white text-black border-gray-200"
        }`}
        style={{
          boxShadow:
            theme === "dark"
              ? ""
              : "0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(158,154,234,0.1)",
        }}
      >
        <h2 className={`font-bold mb-3 text-xl bg-gradient-to-r from-[#9e9aea] to-[#bbb8ff] bg-clip-text text-transparent`}>
          Live collaboration
        </h2>

        <p
          className={`font-light leading-relaxed text-sm mb-6 ${
            theme === "dark" ? "text-white/70" : "text-black/70"
          }`}
        >
          Collaborate in real-time with end-to-end encryption.
        </p>

        {error && (
          <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-700/50 rounded-xl text-yellow-200 text-sm backdrop-blur-sm mb-5 p-3">
            {error}
          </div>
        )}

        <div className={`space-y-4 mb-7`}>
          <h3
            className={`font-semibold text-sm mb-4 ${
              theme === "dark" ? "text-white/90" : "text-black/90"
            }`}
          >
            Session type:
          </h3>

          <label
            className={`group flex items-center rounded-xl border cursor-pointer transition-all duration-200 p-4 ${
              selectedRoomType === "duo"
                ? "border-[#9e9aea] bg-gradient-to-r from-[#9e9aea]/10 to-[#9e9aea]/5 shadow-lg shadow-[#9e9aea]/10"
                : theme === "dark"
                ? "border-[#444] hover:border-[#666] hover:bg-[#2a2a30]"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="roomType"
              value="duo"
              checked={selectedRoomType === "duo"}
              onChange={(e) => setSelectedRoomType(e.target.value as RoomType)}
              className="sr-only"
              disabled={isLoading}
            />
            <div
              className={`rounded-full border-2 flex items-center justify-center transition-all duration-200 w-5 h-5 mr-4 ${
                selectedRoomType === "duo"
                  ? "border-[#9e9aea] shadow-sm shadow-[#9e9aea]/30"
                  : theme === "dark"
                  ? "border-[#666] group-hover:border-[#888]"
                  : "border-gray-400 group-hover:border-gray-500"
              }`}
            >
              {selectedRoomType === "duo" && <div className="rounded-full bg-[#9e9aea] w-2.5 h-2.5"></div>}
            </div>
            <div className="flex items-center gap-3 flex-1 text-left">
              <div
                className={`p-2 rounded-lg transition-all duration-200 ${
                  selectedRoomType === "duo"
                    ? "bg-[#9e9aea]/20"
                    : theme === "dark"
                    ? "bg-[#444]/50 group-hover:bg-[#555]/60"
                    : "bg-gray-100 group-hover:bg-gray-200"
                }`}
              >
                <Video size={17} className="text-[#9e9aea]" />
              </div>
              <div>
                <div className={`font-semibold text-sm ${theme === "dark" ? "text-white" : "text-black"}`}>
                  Private Session
                </div>
                <div
                  className={`text-xs leading-relaxed ${
                    theme === "dark" ? "text-white/60" : "text-black/60"
                  }`}
                >
                  2 people max with video calling
                </div>
              </div>
            </div>
          </label>

          <label
            className={`group flex items-center rounded-xl border cursor-pointer transition-all duration-200 p-4 ${
              selectedRoomType === "group"
                ? "border-[#9e9aea] bg-gradient-to-r from-[#9e9aea]/10 to-[#9e9aea]/5 shadow-lg shadow-[#9e9aea]/10"
                : theme === "dark"
                ? "border-[#444] hover:border-[#666] hover:bg-[#2a2a30]"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="roomType"
              value="group"
              checked={selectedRoomType === "group"}
              onChange={(e) => setSelectedRoomType(e.target.value as RoomType)}
              className="sr-only"
              disabled={isLoading}
            />
            <div
              className={`rounded-full border-2 flex items-center justify-center transition-all duration-200 w-5 h-5 mr-4 ${
                selectedRoomType === "group"
                  ? "border-[#9e9aea] shadow-sm shadow-[#9e9aea]/30"
                  : theme === "dark"
                  ? "border-[#666] group-hover:border-[#888]"
                  : "border-gray-400 group-hover:border-gray-500"
              }`}
            >
              {selectedRoomType === "group" && <div className="rounded-full bg-[#9e9aea] w-2.5 h-2.5"></div>}
            </div>
            <div className="flex items-center gap-3 flex-1 text-left">
              <div
                className={`p-2 rounded-lg transition-all duration-200 ${
                  selectedRoomType === "group"
                    ? "bg-[#9e9aea]/20"
                    : theme === "dark"
                    ? "bg-[#444]/50 group-hover:bg-[#555]/60"
                    : "bg-gray-100 group-hover:bg-gray-200"
                }`}
              >
                <Users size={17} className="text-[#9e9aea]" />
              </div>
              <div>
                <div className={`font-semibold text-sm ${theme === "dark" ? "text-white" : "text-black"}`}>
                  Group Session
                </div>
                <div
                  className={`text-xs leading-relaxed ${
                    theme === "dark" ? "text-white/60" : "text-black/60"
                  }`}
                >
                  Multiple people, canvas collaboration
                </div>
              </div>
            </div>
          </label>
        </div>
        <button
          onClick={handleStartSession}
          disabled={isLoading}
          className={`w-full bg-gradient-to-r from-[#a8a5ff] to-[#bbb8ff] text-black font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer hover:from-[#bbb8ff] hover:to-[#ccc9ff] hover:shadow-lg hover:shadow-[#9e9aea]/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] py-3.5 px-8`}
>
          <Play size={19} className="text-black" />
          <span className="font-semibold text-sm">{isLoading ? "Starting..." : "Start session"}</span>
        </button>
      </div>
    </div>,
    document.body
  );
};
