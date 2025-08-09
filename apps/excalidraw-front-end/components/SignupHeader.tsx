interface SignupHeaderProps {
  isDark: boolean;
}

const SignupHeader: React.FC<SignupHeaderProps> = ({ isDark }) => {
  return (
    <div className="pt-6 text-center">
      <h1
        className="text-5xl font-bold mb-1 animate-pulse"
        style={{
          color: isDark ? "#e2dfff" : "#383e44",
          textShadow: "1.5px 1.5px 3px rgba(0,0,0,0.1)",
          fontFamily: "Comic Sans MS, cursive",
        }}
      >
        Drawdeck
      </h1>
      <p
        className="text-md opacity-80"
        style={{ color: isDark ? "#ced4da" : "#363c41" }}
      >
        Where ideas come to life
      </p>
    </div>
  );
};

export default SignupHeader;