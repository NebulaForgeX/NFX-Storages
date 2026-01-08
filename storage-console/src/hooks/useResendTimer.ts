import { useCallback, useEffect, useState } from "react";

import TimerStore, { useTimerStore } from "@/stores/timerStore";

export const useResendTimer = () => {
  const canResendFromStore = useTimerStore((state) => state.canResendCode());
  const getTimeLeft = useTimerStore((state) => state.getTimeLeft);

  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  const [canResend, setCanResend] = useState(canResendFromStore);

  useEffect(() => {
    // Update timer every second
    const interval = setInterval(() => {
      const remaining = getTimeLeft();
      setTimeLeft(remaining);
      setCanResend(remaining === 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [getTimeLeft]);

  const startTimer = useCallback((seconds: number = 60) => {
    const expiry = Date.now() + seconds * 1000;
    TimerStore.getState().setResendCodeExpiry(expiry);
    setTimeLeft(seconds);
    setCanResend(false);
  }, []);

  return {
    timeLeft,
    canResend,
    startTimer,
  };
};
