// WelcomeButtons.tsx
import React from 'react';

interface WelcomeButtonProps {
    onClick: () => void;
    label: string;
}

const WelcomeButton: React.FC<WelcomeButtonProps> = ({ onClick, label }) => {
    return (
        <button onClick={onClick} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            {label}
        </button>
    );
};

export const WelcomeButtons: React.FC<{ onCollabClick: () => void; onSignupClick: () => void; }> = ({ onCollabClick, onSignupClick }) => {
    return (
        <div className="flex flex-col space-y-2 mt-4">
            <WelcomeButton onClick={onCollabClick} label="Live collaboration..." />
            <WelcomeButton onClick={onSignupClick} label="Sign up" />
        </div>
    );
};
