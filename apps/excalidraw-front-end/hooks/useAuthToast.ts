"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

export function useAuthToast() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || !user.createdAt || hasShownToast.current) return;

    const userCreatedAt = new Date(user.createdAt);
    const now = new Date();
    const timeDiff = now.getTime() - userCreatedAt.getTime();
    const isNewUser = timeDiff < 30000;

    const sessionStart = sessionStorage.getItem("session_start_time");
    const currentTime = Date.now().toString();

    if (!sessionStart) {
      sessionStorage.setItem("session_start_time", currentTime);

      setToastMessage(isNewUser ? "Successfully signed up!" : "Successfully signed in!");

      hasShownToast.current = true;

      setTimeout(() => setToastMessage(null), 3000);
    }
  }, [isLoaded, isSignedIn, user]);

  return { toastMessage, setToastMessage };
}
