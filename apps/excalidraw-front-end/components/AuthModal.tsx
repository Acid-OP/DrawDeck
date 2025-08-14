"use client";
import { useRouter } from 'next/navigation';
import { X, Lock, ArrowRight } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface AuthModalProps {
  isOpen: boolean;
}

export default function AuthModal({ isOpen }: AuthModalProps) {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignIn = () => {
    router.push('/signin');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="relative bg-[#232329] text-white w-full max-w-md p-6 rounded-2xl shadow-2xl border border-[#333] animate-in fade-in duration-200"
      >
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-[#9e9aea]/20 rounded-full flex items-center justify-center">
            <Lock size={28} className="text-[#9e9aea]" />
          </div>

          <h2 className="text-xl font-bold mb-3" style={{ color: "#9e9aea" }}>
            Authentication Required
          </h2>

          <p className="text-white/90 text-sm leading-relaxed mb-6">
            You need to be logged in to join this collaborative room.
          </p>

          <button
            onClick={handleSignIn}
            className="w-full bg-[#9e9aea] text-black px-6 py-3 rounded-lg hover:bg-[#bbb8ff] transition-all duration-200 font-medium flex items-center justify-center gap-2 cursor-pointer"
          >
            Continue to Sign In
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}