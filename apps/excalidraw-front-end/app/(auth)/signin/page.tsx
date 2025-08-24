"use client";
import { useErrorBoundary } from "@/hooks/hooks";
import ErrorFallback from "@/components/Errorfallback";
import FloatingDoodles from "@/components/FloatingDoodles";
import GraphicSection from "@/components/GraphicSession";
import SignInForm from "@/components/SigninForm";
import SignupHeader from "@/components/SignupHeader";
import { useState } from "react";



const ExcalidrawSignup: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(false);
  const { hasError, boundaryError, resetError } = useErrorBoundary();

  if (hasError) {
    return <ErrorFallback error={boundaryError!} resetError={resetError} />;
  }

  return (
    <div
       className={`min-h-screen flex flex-col transition-all duration-500  ${
        isDark ? "bg-[#232329]" : "bg-[#faf6eb]"
      }`}
    >
      {/* <ThemeToggle isDark={isDark} toggleDarkMode={() => setIsDark(!isDark)} /> */}
      <FloatingDoodles />
      <SignupHeader isDark={isDark} />
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center lg:justify-around px-4 py-4 sm:py-6 lg:py-8">
        {/* GraphicSection - Hidden on mobile, visible from tablet onwards */}
        <div className="hidden md:flex flex-shrink-0 w-[340px] lg:w-[380px] mb-4 lg:mb-0">
          <GraphicSection isDark={isDark} />
        </div>
        <div className="flex-shrink-0 w-full max-w-sm sm:max-w-md md:w-[340px] lg:w-[380px]">
          <SignInForm isDark={isDark} />
        </div>
      </div>
    </div>
  );
};

export default ExcalidrawSignup;