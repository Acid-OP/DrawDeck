"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function SSOCallback() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for OAuth errors in URL params
    const oauthError = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (oauthError) {
      console.log('OAuth URL error:', { oauthError, errorDescription });
      
      switch (oauthError) {
        case 'access_denied':
          setError("Access was denied. Please try again.");
          break;
        case 'invalid_request':
          setError("Invalid request. Please try signing in again.");
          break;
        default:
          setError(errorDescription || "Authentication failed. Please try again.");
      }
      
      // Redirect back to signin after showing error
      setTimeout(() => router.push('/signin'), 3000);
      return;
    }

    // Wait for Clerk to load
    if (!isLoaded) return;

    console.log("🔄 SSO Callback - Auth state:", { isLoaded, isSignedIn, userId: user?.id });

    if (isSignedIn && user) {
      console.log("✅ User authenticated successfully");
      router.push("/");
    } else {
      console.log("❌ Authentication failed or incomplete");
      setError("Authentication failed. Please try again.");
      setTimeout(() => router.push('/signin'), 2000);
    }
  }, [isLoaded, isSignedIn, user, router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting you back...</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-green-500 text-4xl mb-4">✅</div>
        <p className="text-gray-600">Authentication successful! Redirecting...</p>
      </div>
    </div>
  );
}