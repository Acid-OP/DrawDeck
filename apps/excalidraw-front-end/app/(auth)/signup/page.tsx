"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSignUp, useUser } from "@clerk/nextjs";
import {
  Palette,
  Sparkles,
  Zap,
  Users,
  Pencil,
  Star,
  Heart,
  ArrowRight,
  AlertCircle,
  Mail,
  CheckCircle,
} from "lucide-react";

// Types
interface FormData {
  emailAddress: string;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

// Custom hook for error handling
const useErrorHandler = () => {
  const [error, setError] = useState<string>("");

  const handleError = useCallback((err: any) => {
    try {
      if (err?.errors?.[0]) {
        const clerkError = err.errors[0];
        setError(clerkError.longMessage || clerkError.message || "Something went wrong");
      } else if (err?.message) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } catch (errorHandlingError) {
      console.error("Error handling failed:", errorHandlingError);
      setError("Something went wrong. Please try again.");
    }
  }, []);

  const clearError = useCallback(() => setError(""), []);

  return { error, handleError, clearError };
};

// Error Boundary Hook
const useErrorBoundary = () => {
  const [hasError, setHasError] = useState(false);
  const [boundaryError, setBoundaryError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setHasError(false);
    setBoundaryError(null);
  }, []);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error("Global error caught:", error);
      setHasError(true);
      setBoundaryError(new Error(error.message));
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      setHasError(true);
      setBoundaryError(new Error(event.reason?.message || "Promise rejection"));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return { hasError, boundaryError, resetError };
};

// Error Fallback Component
const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen bg-[#fff0c9] flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <div className="mb-4 flex justify-center">
          <AlertCircle size={48} color="#ef4444" />
        </div>
        <h2 className="text-xl font-bold text-red-600 mb-2">Oops! Something went wrong</h2>
        <p className="text-gray-600 mb-4 text-sm">
          Don't worry, this happens sometimes. Please try refreshing the page.
        </p>
        <div className="space-y-3">
          <button
            onClick={resetError}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
};

const ExcalidrawSignup: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    emailAddress: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pendingVerification, setPendingVerification] = useState<boolean>(false);
  const [code, setCode] = useState<string>("");
  const [emailSent, setEmailSent] = useState<boolean>(false);

  const { isLoaded, signUp, setActive } = useSignUp();
  const { user } = useUser();
  const router = useRouter();
  const { error, handleError, clearError } = useErrorHandler();
  const { hasError, boundaryError, resetError } = useErrorBoundary();

  // Handle redirect for already signed in users
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) clearError();
  }, [error, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || isLoading) return;

    // Basic validation
    if (!formData.emailAddress.trim()) {
      handleError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.emailAddress.trim())) {
      handleError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    clearError();
    
    try {
      // Create the sign up with email only - Clerk will handle the rest
      const result = await signUp.create({
        emailAddress: formData.emailAddress.trim(),
      });

      // Prepare email verification
      await signUp.prepareEmailAddressVerification({ 
        strategy: "email_code" 
      });
      
      setEmailSent(true);
      setPendingVerification(true);
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || isLoading) return;

    if (!code.trim()) {
      handleError("Please enter the verification code");
      return;
    }

    if (code.trim().length !== 6) {
      handleError("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);
    clearError();
    
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });
      
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/');
      }
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (strategy: "oauth_google" | "oauth_github") => {
    if (!isLoaded) return;
    
    clearError();
    try {
      await signUp?.authenticateWithRedirect({
        strategy,
        redirectUrl: "/",
        redirectUrlComplete: "/"
      });
    } catch (err: any) {
      handleError(err);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || isLoading) return;
    
    setIsLoading(true);
    clearError();
    
    try {
      await signUp.prepareEmailAddressVerification({ 
        strategy: "email_code" 
      });
      setEmailSent(true);
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const floatingDoodles = [
    { icon: Sparkles, color: "#ff6b6b", delay: 0, x: 10, y: 20 },
    { icon: Heart, color: "#4ecdc4", delay: 1, x: 80, y: 10 },
    { icon: Star, color: "#45b7d1", delay: 2, x: 5, y: 50 },
    { icon: Zap, color: "#96ceb4", delay: 0.5, x: 85, y: 70 },
    { icon: Pencil, color: "#feca57", delay: 1.5, x: 25, y: 85 },
    { icon: Users, color: "#ff9ff3", delay: 2.5, x: 70, y: 40 },
    { icon: Heart, color: "#f78fb3", delay: 3, x: 40, y: 30 },
    { icon: Heart, color: "#f78fb3", delay: 3, x: 4, y: 12 },
    { icon: Star, color: "#70a1ff", delay: 1.2, x: 55, y: 80 },
    { icon: Sparkles, color: "#ff6b81", delay: 2.3, x: 5, y: 75 },
    { icon: Zap, color: "#ffdd59", delay: 1.8, x: 95, y: 30 },
    { icon: Pencil, color: "#48dbfb", delay: 2.7, x: 60, y: 5 },
    { icon: Users, color: "#1dd1a1", delay: 0.7, x: 45, y: 55 },
  ];

  // Error boundary fallback
  if (hasError) {
    return <ErrorFallback error={boundaryError!} resetError={resetError} />;
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#fff0c9] flex items-center justify-center">
        <div className="animate-spin">
          <Palette size={48} color="#6965db" />
        </div>
      </div>
    );
  }

  // Show loading if user is signed in (while redirecting)
  if (user) {
    return (
      <div className="min-h-screen bg-[#fff0c9] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Palette size={48} color="#6965db" />
          </div>
          <p className="text-lg" style={{ color: "#6965db" }}>
            Redirecting to home...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen overflow-hidden transition-all duration-500 ${
        isDark ? "bg-[#232329]" : "bg-[#fff0c9]"
      }`}
    >
      {/* Clerk CAPTCHA container - prevents the console error */}
      <div id="clerk-captcha" className="hidden"></div>
      
      <button
        onClick={() => setIsDark(!isDark)}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-yellow-300 hover:bg-yellow-400 transition-all duration-300 cursor-pointer shadow"
      >
        <span className="text-2xl">{isDark ? "🌙" : "☀"}</span>
      </button>

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {floatingDoodles.map((doodle, index) => (
          <div
            key={index}
            className="absolute animate-bounce"
            style={{
              left: `${doodle.x}%`,
              top: `${doodle.y}%`,
              animationDelay: `${doodle.delay}s`,
              animationDuration: `${3 + index * 0.5}s`,
            }}
          >
            <doodle.icon
              size={24 + index * 4}
              color={doodle.color}
              className="opacity-60 hover:opacity-80 transition-opacity duration-300"
            />
          </div>
        ))}
      </div>

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

      <div className="flex flex-col lg:flex-row items-center justify-between mt-12 max-w-screen-xl mx-auto">
        <div className="relative flex items-center justify-center">
          <div className="relative">
            <div
              className="w-96 h-96 rounded-full border-4 border-dashed animate-pulse"
              style={{
                borderColor: isDark ? "#a8a5ff" : "#6965db",
                animationDuration: "3s",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <Palette
                    size={120}
                    color={isDark ? "#a8a5ff" : "#6965db"}
                    className="animate-bounce"
                    style={{ animationDuration: "2s" }}
                  />
                  <div
                    className="absolute -top-8 -right-8 animate-spin"
                    style={{ animationDuration: "8s" }}
                  >
                    <Sparkles size={32} color="#ff6b6b" />
                  </div>
                  <div
                    className="absolute -bottom-8 -left-8 animate-spin"
                    style={{ animationDuration: "6s" }}
                  >
                    <Star size={28} color="#4ecdc4" />
                  </div>
                  <div
                    className="absolute top-0 -left-12 animate-bounce"
                    style={{ animationDelay: "1s" }}
                  >
                    <Zap size={24} color="#feca57" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="w-full max-w-md p-8 rounded-3xl shadow-2xl backdrop-blur-sm border-[3px] border-solid"
          style={{
            backgroundColor: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(255,255,255,0.8)",
            borderColor: isDark ? "#a8a5ff" : "#6965db",
          }}
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="animate-bounce">
                {pendingVerification ? (
                  emailSent ? (
                    <CheckCircle size={48} color="#10b981" />
                  ) : (
                    <Mail size={48} color={isDark ? "#a8a5ff" : "#6965db"} />
                  )
                ) : (
                  <Sparkles size={48} color={isDark ? "#a8a5ff" : "#6965db"} />
                )}
              </div>
            </div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{
                color: isDark ? "#ced4da" : "#363c41",
                fontFamily: "Comic Sans MS, cursive",
              }}
            >
              {pendingVerification ? "Check your email!" : "Hi there!"}
            </h2>
            <p
              className="text-md pt-2 opacity-80"
              style={{ color: isDark ? "#ced4da" : "#363c41" }}
            >
              {pendingVerification ? 
                `We sent a verification code to ${formData.emailAddress}` : 
                "Join the creative community in seconds"
              }
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div 
              className="mb-6 p-4 rounded-xl border-2 border-solid"
              style={{
                backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
                borderColor: "#ef4444",
                color: "#ef4444"
              }}
            >
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {pendingVerification ? (
            <div className="space-y-6">
              <form onSubmit={handleVerification} className="space-y-6">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: isDark ? "#ced4da" : "#363c41" }}
                  >
                    Verification Code
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    autoComplete="one-time-code"
                    className="w-full px-4 py-3 rounded-xl border-2 border-solid transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-0 text-center text-xl font-mono tracking-wider"
                    style={{
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(255,255,255,0.8)",
                      borderColor: isDark ? "#a8a5ff" : "#6965db",
                      color: isDark ? "#ced4da" : "#000000",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || code.length !== 6}
                  className="w-full py-4 px-6 rounded-xl font-bold text-white border-2 border-solid transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: isDark ? "#a8a5ff" : "#6965db",
                    borderColor: isDark ? "#e2dfff" : "#1a0265",
                  }}
                >
                  {isLoading ? "Verifying..." : "Verify & Join"}
                  {!isLoading && <ArrowRight size={20} />}
                </button>
              </form>
              
              <div className="text-center">
                <p
                  className="text-sm mb-3"
                  style={{ color: isDark ? "#ced4da" : "#6b7280" }}
                >
                  Didn't receive the code?
                </p>
                <button
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-sm font-medium underline hover:no-underline transition-all duration-300 disabled:opacity-50"
                  style={{ color: isDark ? "#a8a5ff" : "#6965db" }}
                >
                  {isLoading ? "Sending..." : "Resend verification code"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Social Sign Up Buttons */}
              <div className="space-y-4 mb-6">
                <button
                  onClick={() => handleSocialAuth("oauth_google")}
                  className="w-full py-3 px-6 rounded-xl font-medium border-2 border-solid transition-all duration-300 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(255,255,255,0.9)",
                    borderColor: isDark ? "#4a4a4a" : "#d1d5db",
                    color: isDark ? "#ced4da" : "#374151",
                  }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <button
                  onClick={() => handleSocialAuth("oauth_github")}
                  className="w-full py-3 px-6 rounded-xl font-medium border-2 border-solid transition-all duration-300 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(255,255,255,0.9)",
                    borderColor: isDark ? "#4a4a4a" : "#d1d5db",
                    color: isDark ? "#ced4da" : "#374151",
                  }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Continue with GitHub
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: isDark ? "#4a4a4a" : "#d1d5db" }}></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span 
                    className="px-2"
                    style={{ 
                      backgroundColor: isDark ? "#232329" : "#fff0c9",
                      color: isDark ? "#ced4da" : "#6b7280"
                    }}
                  >
                    Or with your email
                  </span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: isDark ? "#ced4da" : "#363c41" }}
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="emailAddress"
                      value={formData.emailAddress}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      required
                      autoComplete="email"
                      className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-solid transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-0"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(255,255,255,0.8)",
                        borderColor: isDark ? "#a8a5ff" : "#6965db",
                        color: isDark ? "#ced4da" : "#000000",
                      }}
                    />
                    <Mail 
                      size={20} 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2"
                      style={{ color: isDark ? "#a8a5ff" : "#6965db" }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !formData.emailAddress.trim()}
                  className="w-full py-4 px-6 rounded-xl font-bold text-white border-2 border-solid transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: isDark ? "#a8a5ff" : "#6965db",
                    borderColor: isDark ? "#e2dfff" : "#1a0265",
                  }}
                >
                  {isLoading ? "Sending verification..." : "Continue with Email"}
                  {!isLoading && (
                    <ArrowRight
                      size={20}
                      className="transition-transform duration-300"
                    />
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <p
              className="text-sm font-medium"
              style={{ color: isDark ? "#ced4da" : "#363c41" }}
            >
              Already have an account?{" "}
              <button
                className="underline cursor-pointer hover:no-underline transition-all duration-300"
                style={{ color: isDark ? "#a8a5ff" : "#6965db" }}
                onClick={() => router.push("/signin")}
              >
                Sign in instead
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcalidrawSignup;