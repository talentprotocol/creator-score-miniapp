import type { ReactNode } from "react";
import React, {
  createContext,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import type {
  GlobalOptions as ConfettiGlobalOptions,
  CreateTypes as ConfettiInstance,
  Options as ConfettiOptions,
} from "canvas-confetti";
import confetti from "canvas-confetti";

import { Button, ButtonProps } from "@/components/ui/button";

type Api = {
  fire: (options?: ConfettiOptions) => void;
};

type Props = React.ComponentPropsWithRef<"canvas"> & {
  options?: ConfettiOptions;
  globalOptions?: ConfettiGlobalOptions;
  manualstart?: boolean;
  children?: ReactNode;
};

export type ConfettiRef = Api | null;

const ConfettiContext = createContext<Api>({} as Api);

const Confetti = forwardRef<ConfettiRef, Props>((props, ref) => {
  const {
    options,
    globalOptions = { resize: true, useWorker: false },
    manualstart = false,
    children,
    ...rest
  } = props;
  const instanceRef = useRef<ConfettiInstance | null>(null); // confetti instance

  const canvasRef = useCallback(
    // https://react.dev/reference/react-dom/components/common#ref-callback
    // https://reactjs.org/docs/refs-and-the-dom.html#callback-refs
    (node: HTMLCanvasElement) => {
      if (node !== null) {
        // <canvas> is mounted => create the confetti instance
        if (instanceRef.current) return; // if not already created
        instanceRef.current = confetti.create(node, {
          ...globalOptions,
          resize: true,
        });
      } else {
        // <canvas> is unmounted => reset and destroy instanceRef
        if (instanceRef.current) {
          instanceRef.current.reset();
          instanceRef.current = null;
        }
      }
    },
    [globalOptions],
  );

  // `fire` is a function that calls the instance() with `opts` merged with `options`
  const fire = useCallback(
    (opts = {}) => instanceRef.current?.({ ...options, ...opts }),
    [options],
  );

  const api = useMemo(
    () => ({
      fire,
    }),
    [fire],
  );

  useImperativeHandle(ref, () => api, [api]);

  useEffect(() => {
    if (!manualstart) {
      fire();
    }
  }, [manualstart, fire]);

  return (
    <ConfettiContext.Provider value={api}>
      <canvas ref={canvasRef} {...rest} />
      {children}
    </ConfettiContext.Provider>
  );
});

/**
 * Props for the ConfettiButton component
 */
interface ConfettiButtonProps extends ButtonProps {
  /** Custom confetti options and global settings */
  options?: ConfettiOptions &
    ConfettiGlobalOptions & { canvas?: HTMLCanvasElement };
  /** Button content */
  children?: React.ReactNode;
  /** Whether to automatically fire confetti when component mounts */
  autoFire?: boolean;
  /** Callback function called when confetti animation completes */
  onConfettiComplete?: () => void;
}

/**
 * Button component that fires confetti animation
 *
 * This component extends the base Button with confetti capabilities:
 * - Manual confetti firing on click
 * - Automatic confetti firing on mount (for success states)
 * - Custom confetti options and positioning
 * - Completion callback for state transitions
 *
 * The confetti uses a temporary canvas overlay to avoid conflicts
 * and provides smooth animations with customizable colors and effects.
 *
 * @example
 * ```typescript
 * // Manual confetti on click
 * <ConfettiButton onClick={handleClick}>
 *   Click for confetti!
 * </ConfettiButton>
 *
 * // Auto-fire confetti for success state
 * <ConfettiButton
 *   autoFire={true}
 *   onConfettiComplete={handleConfettiComplete}
 * >
 *   Success!
 * </ConfettiButton>
 * ```
 */
function ConfettiButton({
  options,
  children,
  onClick,
  autoFire = false,
  onConfettiComplete,
  ...props
}: ConfettiButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hasAutoFired = useRef(false);

  /**
   * Fires confetti animation from the button's position
   *
   * Creates a temporary canvas overlay, positions confetti relative to the button,
   * and cleans up after animation completes. Uses brand green colors by default.
   */
  const fireConfetti = useCallback(() => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Create a temporary canvas to use confetti without workers
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999";
    document.body.appendChild(canvas);

    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: false,
    });

    myConfetti({
      particleCount: 100,
      spread: 70,
      colors: ["#84cc16", "#65a30d", "#4ade80", "#86efac", "#bbf7d0"],
      ...options,
      origin: {
        x: x / window.innerWidth,
        y: y / window.innerHeight,
      },
    });

    // Clean up after animation and call completion callback
    setTimeout(() => {
      document.body.removeChild(canvas);
      onConfettiComplete?.();
    }, 3000);
  }, [options, onConfettiComplete]);

  // Auto-fire confetti when component mounts (for success state)
  useEffect(() => {
    if (autoFire && !hasAutoFired.current) {
      hasAutoFired.current = true;
      // Small delay to ensure button is rendered
      setTimeout(fireConfetti, 100);
    }
  }, [autoFire, fireConfetti]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Call original onClick first if it exists
    onClick?.(event);

    // Fire confetti on manual click (for test button)
    if (!autoFire) {
      fireConfetti();
    }
  };

  return (
    <Button ref={buttonRef} onClick={handleClick} {...props}>
      {children}
    </Button>
  );
}

Confetti.displayName = "Confetti";

export { Confetti, ConfettiButton };
