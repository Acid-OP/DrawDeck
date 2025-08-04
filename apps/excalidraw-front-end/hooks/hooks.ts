"use client"
import { useState, useEffect, useCallback } from "react";

export const useErrorHandler = () => {
  const [error, setError] = useState<string>("");

  const handleError = useCallback((err: string) => {
    setError(err);
  }, []);

  const clearError = useCallback(() => setError(""), []);

  return { error, handleError, clearError };
};

export const useErrorBoundary = () => {
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