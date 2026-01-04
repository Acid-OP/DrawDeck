"use client";

import React, { useEffect, useState } from "react";
import SignupButton from "./SignupWelcomeButton";
import BrandTitle from "./BrandTitle";
import { LiveCollabModal } from "./modal/LiveCollabModal";
import LiveCollaborationButton from "./CollaborationButton ";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useSession } from "next-auth/react";

interface HeaderProps {}

export const Header: React.FC<HeaderProps> = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { status } = useSession();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div>
      <div className="flex flex-col items-center justify-center p-4 pointer-events-auto">
        <BrandTitle />
        <span className="virgil text-lg text-[#7a7a7a] p-4 text-center">
          Draw together with built-in video calls & end-to-end encryption
        </span>

        <div className="flex items-center justify-start w-full cursor-pointer">
          <div className="w-full p-4">
            <LiveCollaborationButton onClick={() => setIsModalOpen(true)} />
            {isLoaded && status !== "authenticated" && (
              <SignupButton onClick={() => router.push("/signup")} />
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <LiveCollabModal onClose={() => setIsModalOpen(false)} source="header" />
      )}
    </div>
  );
};