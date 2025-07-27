import React from 'react';
import LiveCollaborationButton from './CollaborationButton ';
import SignupButton from './SignupWelcomeButton';
import BrandTitle from './BrandTitle';

interface HeaderProps {
  theme: 'light' | 'dark';
}

export const Header: React.FC<HeaderProps> = ({theme}) => {
  return (
      <div>
      <div className="flex flex-col items-center justify-center p-4 pointer-events-auto">
          <BrandTitle theme = {theme}/>
          <span className='virgil text-2xl text-[#7a7a7a] p-4'>All your data is saved locally in your browser</span>
          <div className='flex items-center justify-start w-full p-6 cursor-pointer pl-12'>
              <div className="w-full p-4">
                  <LiveCollaborationButton theme = {theme}/>
                  <SignupButton theme = {theme}/>
              </div>
          </div>
      </div>
      </div>
  );
};