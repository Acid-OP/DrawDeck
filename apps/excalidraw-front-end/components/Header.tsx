"use client";

import React, { useEffect, useState } from "react";
import SignupButton from "./SignupWelcomeButton";
import BrandTitle from "./BrandTitle";
import { LiveCollabModal } from "./modal/LiveCollabModal";
import LiveCollaborationButton from "./CollaborationButton ";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { createClient } from "@/utils/supabase/client";

interface HeaderProps {}

export const Header: React.FC<HeaderProps> = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supabase] = useState(() => createClient());
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSignedIn(!!session);
      setIsLoaded(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsSignedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);


  return (
    <div>
      <div className="flex flex-col items-center justify-center p-4 pointer-events-auto">
        <BrandTitle />
        <span className="virgil text-lg text-[#7a7a7a] p-4">
          All your data is saved locally in your browser
        </span>

        <div className="flex items-center justify-start w-full cursor-pointer">
          <div className="w-full p-4">
            <LiveCollaborationButton onClick={() => setIsModalOpen(true)} />
            {isLoaded && !isSignedIn && (
              <SignupButton onClick={() => router.push("/auth/signup")} />
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