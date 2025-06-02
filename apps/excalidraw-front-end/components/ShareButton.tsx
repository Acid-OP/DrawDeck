interface ShareButtonProps {
  onClick?: () => void;
}

export function ShareButton({ onClick }: ShareButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-md bg-[#a8a5ff] text-black hover:bg-[#bcbaff] transition-colors cursor-pointer"
    >
      Share
    </button>
  );
}