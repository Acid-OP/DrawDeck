"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, User, Loader2 } from "lucide-react";
import { useErrorHandler } from "@/hooks/hooks";
import type { ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";

interface SignInFormProps {
  isDark: boolean;
}

type OAuthProvider = "google" | "github" | "facebook";

const getOAuthErrorMessage = (error: any): string => {
  const errorMessage = error?.message || error?.error_description || error?.code;
  
  switch (errorMessage) {
    case 'Email not confirmed':
      return "Please check your email and click the confirmation link before signing in.";
    
    case 'Invalid login credentials':
      return "Invalid credentials. Please try again.";
    
    case 'User already registered':
      return "An account with this email already exists. Try signing in instead.";
    
    case 'OAuth provider error':
    case 'access_denied':
      return "Access was denied. Please try again or use a different sign-in method.";
    
    case 'Network error':
      return "Network error. Please check your connection and try again.";
    
    case 'popup_closed_by_user':
      return "Sign-in was cancelled. Please try again.";
    
    default:
      console.error('Unhandled OAuth error:', error);
      return "Something went wrong. Please try again.";
  }
};

const SignInForm: React.FC<SignInFormProps> = ({ isDark }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const { error, handleError, clearError } = useErrorHandler();

  const handleOAuth = async (provider: OAuthProvider) => {
    setIsLoading(true);
    setLoadingProvider(provider);
    clearError();

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error("OAuth error:", error);
        handleError(getOAuthErrorMessage(error));
        return;
      }
    } catch (err: any) {
      console.error("OAuth signin error:", err);
      handleError(getOAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const renderOAuthButton = (
    provider: OAuthProvider,
    icon: ReactNode,
    ariaLabel: string
  ) => {
    const isProviderLoading = loadingProvider === provider;
    
    return (
      <button
        onClick={() => handleOAuth(provider)}
        disabled={isLoading}
        className="px-8 py-3 flex items-center cursor-pointer justify-center rounded-md border border-black transition-all duration-300 hover:scale-[1.05] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed relative"
        style={{ backgroundColor: "#fff0c9" }}
        aria-label={ariaLabel}
        suppressHydrationWarning
      >
        {isProviderLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          icon
        )}
      </button>
    );
  };

  return (
    <div
      className="w-full max-w-md p-8 rounded-2xl shadow-2xl backdrop-blur-sm"
      style={{
        backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#fff0c9",
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
            fontFamily: "Comic Sans MS, cursive",
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
            backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
            borderColor: "#ef4444",
            color: "#ef4444",
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
        {renderOAuthButton(
          "google",
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>,
          "Sign in with Google"
        )}
        
        {renderOAuthButton(
          "github",
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>,
          "Sign in with GitHub"
        )}
          
        {renderOAuthButton(
          "facebook",
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#1877F2"
              d="M9.101 23.691v-8.107H6.061V11.6h3.04V8.866c0-3.066 1.835-4.75 4.615-4.75 1.317 0 2.696.236 2.696.236v2.98h-1.518c-1.499 0-1.964.933-1.964 1.892V11.6h3.338l-.532 3.984h-2.806v8.107H9.101z"
            />
          </svg>,
          "Sign in with Facebook"
        )}
      </div>

      {isLoading && (
        <div className="mt-4 text-center">
          <p
            className="text-sm font-medium flex items-center justify-center gap-2"
            style={{ color: isDark ? "#a8a5ff" : "#6965db" }}
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting to authentication...
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-col items-center space-y-2 w-full max-w-xs mx-auto">
        <div className="flex items-center w-full justify-center gap-2">
          <div className="border-t border-solid border-black" style={{ width: '40px' }}></div>
          <span className="text-xs font-semibold text-black">or</span>
          <div className="border-t border-solid border-black" style={{ width: '40px' }}></div>
        </div>
        
        <p
          className="text-xs font-medium cursor-pointer text-center hover:underline transition-all duration-200"
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
