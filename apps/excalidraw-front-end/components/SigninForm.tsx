"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, User } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useErrorHandler } from "@/hooks/hooks";

interface SignInFormProps {
  isDark: boolean;
}

type OAuthProvider = "google" | "github" | "facebook";

const getOAuthErrorMessage = (error: any): string => {
  const code = error?.error_description || error?.message || error?.code;

  switch (code) {
    case "access_denied":
      return "Access was denied. Please try again or use a different sign-in method.";
    case "popup_closed_by_user":
      return "Sign-in was cancelled. Please try again.";
    case "Network error":
      return "Network error. Please check your connection and try again.";
    default:
      console.error("Unhandled OAuth error:", error);
      return "Something went wrong. Please try again.";
  }
};

const SignInForm: React.FC<SignInFormProps> = ({ isDark }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const { error, handleError, clearError } = useErrorHandler();

  const handleOAuth = async (provider: OAuthProvider) => {
    setIsLoading(true);
    clearError();

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      }); 

      if (error) {
        handleError(getOAuthErrorMessage(error));
      }
    } catch (err) {
      handleError(getOAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-md p-8 rounded-2xl shadow-2xl backdrop-blur-sm"
      style={{
        backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#fff0c9"
      }}
    >
      <div className="text-center mb-6">
        <div className="flex justify-center mb-1">
          <div className="animate-bounce">
            <User
              size={40}
              style={{ color: isDark ? "#a8a5ff" : "#6965db" }}
            />
          </div>
        </div>
        <h2
          className="text-2xl font-bold mb-1"
          style={{
            color: isDark ? "#ced4da" : "#363c41",
            fontFamily: "Comic Sans MS, cursive"
          }}
        >
          Welcome back!
        </h2>
        <p
          className="text-sm opacity-80"
          style={{ color: isDark ? "#ced4da" : "#363c41" }}
        >
          Sign in to your account
        </p>
      </div>
      
      {error && (
        <div
          className="mb-5 p-3 rounded-xl border-2 border-solid"
          style={{
            backgroundColor: isDark
              ? "rgba(239, 68, 68, 0.1)"
              : "rgba(239, 68, 68, 0.05)",
            borderColor: "#ef4444",
            color: "#ef4444"
          }}
        >
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}
      <div
        className="flex items-center justify-center gap-3 p-3 rounded-md"
        style={{ backgroundColor: "#fff0c9" }}
      >
        <button
          onClick={() => handleOAuth("google")}
          disabled={isLoading}
          className="px-8 py-3 flex items-center cursor-pointer justify-center rounded-md border border-black transition-all duration-300 hover:scale-[1.05] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#fff0c9" }}
          suppressHydrationWarning
        >
        </button>
        <button
          onClick={() => handleOAuth("github")}
          disabled={isLoading}
          className="px-8 py-3 flex items-center cursor-pointer justify-center rounded-md border border-black transition-all duration-300 hover:scale-[1.05] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#fff0c9" }}
          suppressHydrationWarning
        >
        </button>
        <button
          onClick={() => handleOAuth("facebook")}
          disabled={isLoading}
          className="px-8 py-3 flex items-center cursor-pointer justify-center rounded-md border border-black transition-all duration-300 hover:scale-[1.05] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#fff0c9" }}
          suppressHydrationWarning
        >
        </button>
      </div>
      <div className="mt-5 flex flex-col items-center space-y-2 w-full max-w-xs mx-auto">
        <div className="flex items-center w-full justify-center gap-2">
          <div
            className="border-t border-solid border-black"
            style={{ width: "40px" }}
          ></div>
          <span className="text-xs font-semibold text-black">or</span>
          <div
            className="border-t border-solid border-black"
            style={{ width: "40px" }}
          ></div>
        </div>
        <p
          className="text-xs font-medium cursor-pointer text-center"
          style={{ color: "#6965db" }}
          onClick={() => router.push("/signup")}
          suppressHydrationWarning
        >
          Don't have an account?
        </p>
      </div>
    </div>
  );
};
export default SignInForm;