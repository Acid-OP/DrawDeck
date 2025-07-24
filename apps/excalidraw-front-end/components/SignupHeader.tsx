interface SignupHeaderProps {
  isDark: boolean;
}

const SignupHeader: React.FC<SignupHeaderProps> = ({ isDark }) => {
  return (
    <div className="pt-8 text-center">
      <h1
        className="text-6xl font-bold mb-2 animate-pulse"
        style={{
          color: isDark ? "#e2dfff" : "#1a0265",
          textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
          fontFamily: "Comic Sans MS, cursive",
        }}
      >
        Excalidraw
      </h1>
      <p
        className="text-xl opacity-80"
        style={{ color: isDark ? "#ced4da" : "#363c41" }}
      >
        Where ideas come to life
      </p>
    </div>
  );
};

export default SignupHeader;