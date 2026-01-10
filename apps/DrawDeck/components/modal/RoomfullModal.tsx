import React, { useEffect, useRef } from 'react';
import { X, Users, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

interface RoomFullModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomFullError: {
    message: string;
    maxCapacity: number;
    currentCount: number;
  };
  onGoBack: () => void;
  onTryAgain: () => void;
}

export const RoomFullModal: React.FC<RoomFullModalProps> = ({
  isOpen,
  onClose,
  roomFullError,
  onGoBack,
  onTryAgain
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="relative bg-[#232329] text-white w-full max-w-md p-8 rounded-2xl shadow-2xl border border-[#333] animate-in fade-in duration-200"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
        >
          <X size={20} />
        </button>

        <div className="text-center">

          <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertCircle size={32} className="text-red-400" />
          </div>

          <h2 className="text-2xl font-bold mb-3" style={{ color: "#9e9aea" }}>
            Room is Full!
          </h2>

          <p className="text-white/80 text-base leading-relaxed mb-2">
            This duo room can only accommodate{' '}
            <span className="font-medium text-[#9e9aea]">{roomFullError.maxCapacity} participants</span>.
          </p>
          
          <div className="flex items-center justify-center gap-2 mb-6 text-white/60">
            <Users size={16} />
            <span className="text-sm">
              Currently {roomFullError.currentCount}/{roomFullError.maxCapacity} people in room
            </span>
          </div>

          <div className="bg-[#9e9aea]/10 border border-[#9e9aea]/20 rounded-lg p-4 mb-8">
            <p className="text-sm text-white/70 leading-relaxed">
              <span className="font-medium">Tip:</span> Try creating a new duo room or wait for someone to leave this one. 
              You can also switch to a group session for unlimited participants.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onGoBack}
              className="flex-1 bg-[#333] text-white px-4 py-3 rounded-lg hover:bg-[#404040] transition-all duration-200 font-medium flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
            
            <button
              onClick={onTryAgain}
              className="flex-1 bg-[#9e9aea] text-black px-4 py-3 rounded-lg hover:bg-[#bbb8ff] transition-all duration-200 font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


const RoomFullModalDemo = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(true);

  const mockRoomFullError = {
    message: "This duo room is full. Only 2 participants are allowed.",
    maxCapacity: 2,
    currentCount: 2
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-white text-2xl mb-4">Room Full Modal Demo</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#9e9aea] text-black px-6 py-3 rounded-lg hover:bg-[#bbb8ff] transition-colors"
        >
          Show Room Full Modal
        </button>
      </div>

      <RoomFullModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        roomFullError={mockRoomFullError}
        onGoBack={() => {
          console.log('Going back...');
          setIsModalOpen(false);
        }}
        onTryAgain={() => {
          console.log('Trying again...');
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default RoomFullModalDemo;