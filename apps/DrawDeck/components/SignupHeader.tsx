interface SignupHeaderProps {
  isDark: boolean;
}

const SignupHeader: React.FC<SignupHeaderProps> = ({ isDark }) => {
  return (
    <div className="pt-4 sm:pt-6 text-center px-4">
      <h1
        className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-1 animate-pulse"
        style={{
          color: isDark ? "#e2dfff" : "#383e44",
          textShadow: "1.5px 1.5px 3px rgba(0,0,0,0.1)",
          fontFamily: "Virgil",
        }}
      >
        Drawdeck
      </h1>
      <p
        className="text-sm sm:text-base lg:text-md opacity-80"
        style={{ 
          color: isDark ? "#ced4da" : "#363c41",
          fontFamily: "Virgil"
        }}
      >
        Where ideas come to life
      </p>
    </div>
  );
};

export default SignupHeader;