"use client";
import { useErrorBoundary } from "@/hooks/hooks";
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
        isDark ? "bg-[#232329]" : "bg-[#fffbf0]"
      }`}
    >
      {/* <ThemeToggle isDark={isDark} toggleDarkMode={() => setIsDark(!isDark)} /> */}

      <FloatingDoodles />
      <SignupHeader isDark={isDark} />

      <div className="flex flex-col lg:flex-row items-center justify-around mt-28 max-w-screen-xl mx-auto px-4">
        <div className="flex-shrink-0 w-[340px] lg:w-[380px]">
          <GraphicSection isDark={isDark} />
        </div>
        <div className="flex-shrink-0 w-[340px] lg:w-[380px] mt-4 lg:mt-0">
          <SignupForm isDark={isDark} />
        </div>
      </div>
    </div>
  );
};

export default ExcalidrawSignup;