"use client";
import { useErrorBoundary } from "@/app/hooks/hooks";
import ErrorFallback from "@/components/Errorfallback";
import FloatingDoodles from "@/components/FloatingDoodles";
import GraphicSection from "@/components/GraphicSession";
import SignupForm from "@/components/SignupForm";
import SignupHeader from "@/components/SignupHeader";
import ThemeToggle from "@/components/Themetoggle";
import { useState } from "react";



const ExcalidrawSignup: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(false);
  const { hasError, boundaryError, resetError } = useErrorBoundary();

  if (hasError) {
    return <ErrorFallback error={boundaryError!} resetError={resetError} />;
  }

  return (
    <div
      className={`min-h-screen overflow-hidden transition-all duration-500 ${
        isDark ? "bg-[#232329]" : "bg-[#fff0c9]"
      }`}
    >
      <ThemeToggle isDark={isDark} toggleDarkMode={() => setIsDark(!isDark)} />
      <FloatingDoodles />
      <SignupHeader isDark={isDark} />
      <div className="flex flex-col lg:flex-row items-center justify-between mt-12 max-w-screen-xl mx-auto">
        <GraphicSection isDark={isDark} />
        <SignupForm isDark={isDark} />
      </div>
    </div>
  );
};

export default ExcalidrawSignup;