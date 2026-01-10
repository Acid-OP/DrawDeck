import { useEffect, useState } from "react";

export const CanvasRateLimitNotification = ({ 
  rateLimitState 
}: { 
  rateLimitState?: {
    messagesRemaining: number;
    isBlocked: boolean;
    retryAfter: number;
  };
}) => {
  const [localAlertShown, setLocalAlertShown] = useState({
    blocked: false,
    warning: false,
    lastWarningCount: 0
  });
  useEffect(() => {
    if (rateLimitState?.isBlocked && !localAlertShown.blocked) {
      alert(`Rate Limited!\n\nToo many drawing actions. Please wait ${Math.ceil(rateLimitState.retryAfter / 1000)} seconds.\n\nYour drawings are being queued automatically.`);
      setLocalAlertShown(prev => ({ ...prev, blocked: true }));
    }

    if (!rateLimitState?.isBlocked && localAlertShown.blocked) {
      setLocalAlertShown(prev => ({ ...prev, blocked: false }));
    }
  }, [rateLimitState?.isBlocked, rateLimitState?.retryAfter, localAlertShown.blocked]);

  useEffect(() => {
    const remaining = rateLimitState?.messagesRemaining || 50;
    
    if (!rateLimitState?.isBlocked && remaining <= 1 && remaining > 0) {
      if (remaining !== localAlertShown.lastWarningCount) {
        alert(`Drawing Rate Limit!\n\n${remaining} action remaining.\n\nNext drawing will be queued!`);
        setLocalAlertShown(prev => ({ 
          ...prev, 
          warning: true, 
          lastWarningCount: remaining 
        }));
      }
    }

    if (remaining > 1) {
      setLocalAlertShown(prev => ({ ...prev, warning: false, lastWarningCount: 0 }));
    }
  }, [rateLimitState?.messagesRemaining, rateLimitState?.isBlocked, localAlertShown.lastWarningCount]);

  return null;
};
