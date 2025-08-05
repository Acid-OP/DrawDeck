interface ShareButtonProps {
  onClick?: () => void;
  isCollabMode?: boolean;
}

export function ShareButton({ onClick, isCollabMode = false }: ShareButtonProps) {
  const buttonStyles = isCollabMode 
    ? "px-5 py-2 rounded-md bg-[#0fb884] text-white hover:bg-[#0da670] transition-colors cursor-pointer text-xl font-normal"
    : "px-5 py-2 rounded-md bg-[#a8a5ff] text-black hover:bg-[#bcbaff] transition-colors cursor-pointer text-xl font-normal";

  return (
    <button
      onClick={onClick}
      className={buttonStyles}
    >
      Share
    </button>
  );
}