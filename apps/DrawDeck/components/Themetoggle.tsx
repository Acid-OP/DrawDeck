interface ThemeToggleProps {
  isDark: boolean;
  toggleDarkMode: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, toggleDarkMode }) => {
  return (
    <button
      onClick={toggleDarkMode}
      className="fixed top-4 right-4 z-50 p-2 rounded-full bg-yellow-300 hover:bg-yellow-400 transition-all duration-300 cursor-pointer shadow"
    >
      <span className="text-2xl">{isDark ? "🌙" : "☀"}</span>
    </button>
  );
};

export default ThemeToggle;