import React from 'react';
import LiveCollaborationButton from './CollaborationButton ';
import SignupButton from './SignupWelcomeButton';
import BrandTitle from './BrandTitle';

export const Header: React.FC = () => {
  return (
      <div>
      <div className="flex flex-col items-center justify-center p-4 pointer-events-auto">
          <BrandTitle/>
          <span className='virgil text-2xl text-[#7a7a7a] p-4'>All your data is saved locally in your browser</span>
          <div className='flex items-center justify-start w-full p-6 cursor-pointer pl-12'>
              <div className="w-full">
                  <LiveCollaborationButton/>
                  <SignupButton/>
              </div>
          </div>
      </div>
      </div>
  );
};