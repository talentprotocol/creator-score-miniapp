import { useState, useEffect, useRef } from "react";

interface UseCountingAnimationProps {
  targetValue: number;
  duration: number;
  delay?: number;
  decimals?: number;
  isActive?: boolean;
}

export function useCountingAnimation({
  targetValue,
  duration,
  delay = 0,
  decimals = 0,
  isActive = false,
}: UseCountingAnimationProps) {
  const [currentValue, setCurrentValue] = useState(0);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();

  // Reset when animation becomes active
  useEffect(() => {
    if (isActive) {
      setCurrentValue(0);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const startAnimation = () => {
      const startTime = performance.now();
      startTimeRef.current = startTime;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out function for natural animation
        const easeOutProgress = 1 - Math.pow(1 - progress, 3);

        const newValue = targetValue * easeOutProgress;
        setCurrentValue(Number(newValue.toFixed(decimals)));

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    };

    const timeoutId = setTimeout(startAnimation, delay);

    return () => {
      clearTimeout(timeoutId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration, delay, decimals, isActive]);

  return currentValue;
}
