import { useEffect, useState, useCallback } from "react";

interface InactivityState {
  timeRemaining: number;
  isWarning: boolean;
  isActive: boolean;
}

interface UseInactivityLogoutOptions {
  timeoutDuration?: number;
  warningThreshold?: number; // Remaining time (ms) when to show warning
  onWarning?: () => void;
  onLogout: () => void;
}

const useInactivityLogout = ({
  timeoutDuration = 1800000, // Set to 30 minutes (30 * 60 * 1000)
  warningThreshold = 300000, // Warn when 5 mins (300,000ms) remain - was 83.33 (percent)
  onWarning,
  onLogout,
}: UseInactivityLogoutOptions) => {
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [state, setState] = useState<InactivityState>({
    timeRemaining: timeoutDuration,
    isWarning: false,
    isActive: true,
  });

  const resetTimer = useCallback(() => {
    const now = Date.now();
    setLastActivity(now);
    setState((prev) => ({
      ...prev,
      timeRemaining: timeoutDuration,
      isWarning: false,
      isActive: true,
    }));
  }, [timeoutDuration]);

  useEffect(() => {
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];

    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivity;
      const remaining = Math.max(0, timeoutDuration - elapsed);

      const newState: InactivityState = {
        timeRemaining: remaining,
        isWarning: remaining <= warningThreshold && remaining > 0,
        isActive: remaining > 0,
      };

      setState((prevState) => {
        if (!prevState.isWarning && newState.isWarning && onWarning) {
          onWarning();
        }

        return newState;
      });

      if (remaining <= 0) {
        onLogout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastActivity, timeoutDuration, warningThreshold, onWarning, onLogout]);

  return {
    ...state,
    resetTimer,
    formatTimeRemaining: (ms: number) => {
      const seconds = Math.ceil(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return minutes > 0
        ? `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
        : `${remainingSeconds}s`;
    },
  };
};

export default useInactivityLogout;
