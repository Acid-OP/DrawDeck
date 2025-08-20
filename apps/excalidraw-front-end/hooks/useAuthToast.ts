"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function useAuthToast() {
  const [supabase] = useState(() => createClient());

  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<null | { created_at: string }>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSignedIn(!!session);
      setUser(session?.user ?? null);
      setIsLoaded(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsSignedIn(!!session);
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || hasShownToast.current) return;

    const userCreatedAt = new Date(user.created_at);
    const now = new Date();
    const isNewUser = now.getTime() - userCreatedAt.getTime() < 30_000;

    const sessionStart = sessionStorage.getItem("session_start_time");
    const currentTime = Date.now().toString();

    if (!sessionStart) {
      sessionStorage.setItem("session_start_time", currentTime);
      setToastMessage(isNewUser ? "Successfully signed up!" : "Successfully signed in!");
      hasShownToast.current = true;
      setTimeout(() => setToastMessage(null), 3_000);
    }
  }, [isLoaded, isSignedIn, user]);

  return { toastMessage, setToastMessage };
}
