import { useState, useEffect, useRef, useCallback } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

export function useCopy() {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    await writeText(text);
    setIsCopied(true);
  };

  const resetCopyStatus = () => {
    setIsCopied(false);
  };

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(resetCopyStatus, 3000); // Reset copy status after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  return { isCopied, copyToClipboard, resetCopyStatus };
}

export function useDebounce<T>(value: T, delay: number): T {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Only re-call effect if value or delay changes
  );
  return debouncedValue;
}

export function useHover<T extends HTMLElement = HTMLDivElement>() {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<T>(null);
  const onMouseEnter = useCallback(() => setHovered(true), []);
  const onMouseLeave = useCallback(() => setHovered(false), []);

  useEffect(() => {
    if (ref.current) {
      ref.current.addEventListener("mouseenter", onMouseEnter);
      ref.current.addEventListener("mouseleave", onMouseLeave);

      return () => {
        ref.current?.removeEventListener("mouseenter", onMouseEnter);
        ref.current?.removeEventListener("mouseleave", onMouseLeave);
      };
    }

    return undefined;
  }, []);

  return { ref, hovered };
}
