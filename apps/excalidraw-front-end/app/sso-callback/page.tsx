"use client";
import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Fix: handleRedirectCallback needs params
        await handleRedirectCallback({}, () => Promise.resolve());
        router.push("/");
      } catch (error) {
        console.error("SSO callback error:", error);
        router.push("/signin?error=sso_failed");
      }
    };

    handleCallback();
  }, [handleRedirectCallback, router]);

  return <div>Processing authentication...</div>;
}