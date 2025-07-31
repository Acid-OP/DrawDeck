"use client";

import React, { useState } from 'react';
import SignupButton from './SignupWelcomeButton';
import BrandTitle from './BrandTitle';
import { useAuth } from '@clerk/nextjs';
import { LiveCollabModal } from './modal/LiveCollabModal';
import LiveCollaborationButton from './CollaborationButton ';
import { useRouter } from "next/navigation";

interface HeaderProps {
  theme: 'light' | 'dark';
}

export const Header: React.FC<HeaderProps> = ({ theme }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  return (
    <div>
      <div className="flex flex-col items-center justify-center p-4 pointer-events-auto">
        <BrandTitle theme={theme} />
        <span className='virgil text-2xl text-[#7a7a7a] p-4'>
          All your data is saved locally in your browser
        </span>

        <div className='flex items-center justify-start w-full p-6 cursor-pointer pl-12'>
          <div className="w-full p-4">
            <LiveCollaborationButton theme={theme} onClick={() => setIsModalOpen(true)} />
            {isLoaded && !isSignedIn && <SignupButton theme={theme} onClick={() => router.push('/signup')}/>}
          </div>
        </div>
      </div>
      {isModalOpen && <LiveCollabModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};