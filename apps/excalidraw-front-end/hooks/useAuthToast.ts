"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

export function useAuthToast() {
  const { data: session, status } = useSession();

  const isLoaded = status !== "loading";
  const isSignedIn = status === "authenticated";
  const user = session?.user ?? null;

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || hasShownToast.current) return;

    const storedUser = sessionStorage.getItem("last_user_id");
    const storedStart = sessionStorage.getItem("session_start_time");

    const currentTime = Date.now().toString();
    if (!storedStart || storedUser !== user.email) {
      sessionStorage.setItem("session_start_time", currentTime);
      sessionStorage.setItem("last_user_id", user.email ?? "");
      setToastMessage("Successfully signed in!");
      hasShownToast.current = true;

      setTimeout(() => setToastMessage(null), 3_000);
    }
  }, [isLoaded, isSignedIn, user]);

  return { toastMessage, setToastMessage };
}
