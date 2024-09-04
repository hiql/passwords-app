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

export function isDigit(char: string): boolean {
  return /^\d$/.test(char);
}

export function isLetter(char: string): boolean {
  return /^[A-Za-z]$/.test(char);
}

export function timeToCrackPassword(password: string): string {
  let time;
  console.log(password);
  const passwordLength = password.length;

  const numRegex = /^\d+$/;
  const lowerCaseRegex = /^[a-z\u0080-\uFFFF]*$/; // /^[\p{L}a-z]+$/u   // = /^[\p{Ll}]+$/u;
  const upperCaseRegex = /^[a-zA-Z\u0080-\uFFFF]*$/; // /^[\p{L}A-Z]+$/u
  const letterNumberRegex = /^[a-zA-Z0-9\u0080-\uFFFF]*$/; ///^[\p{L}0-9]+$/u
  const letterNumberSymbolRegex = /^[\p{L}0-9\W]+$/u;

  // check which kind of characters are in the password with each if statement

  if (numRegex.test(password)) {
    if (passwordLength < 12) {
      time = "instantly";
      return time;
    }
    switch (passwordLength) {
      case 12:
        return "2 seconds";
      case 13:
        return "19 seconds";
      case 14:
        return "3 minutes";
      case 15:
        return "32 minutes";
      case 16:
        return "5 hours";
      case 17:
        return "2 days";
      case 18:
        return "3 weeks";
      default:
        return "a lot of time";
    }
  }

  if (lowerCaseRegex.test(password)) {
    if (passwordLength < 9) {
      return "instantly";
    }
    switch (passwordLength) {
      case 9:
        return "10 seconds";
      case 10:
        return "4 minutes";
      case 11:
        return "2 hours";
      case 12:
        return "2 days";
      case 13:
        return "2 months";
      case 14:
        return "4 years";
      case 15:
        return "100 years";
      case 16:
        return "3k years";
      case 17:
        return "69k years";
      case 18:
        return "2m years";
      default:
        time = "a lot of time";
    }
  }

  if (upperCaseRegex.test(password)) {
    if (passwordLength < 7) {
      time = "instantly";
      return time;
    }
    switch (passwordLength) {
      case 7:
        return "2 seconds";
      case 8:
        return "2 minutes";
      case 9:
        return "1 hour";
      case 10:
        return "3 days";
      case 11:
        return "5 months";
      case 12:
        return "24 years";
      case 13:
        return "1k years";
      case 14:
        return "64k years";
      case 15:
        return "3m years";
      case 16:
        return "173m years";
      case 17:
        return "9bn years";
      case 18:
        return "467bn years";
      default:
        time = "a lot of time";
    }
  }

  if (letterNumberRegex.test(password)) {
    if (passwordLength < 7) {
      time = "instantly";
      return time;
    }
    switch (passwordLength) {
      case 7:
        return "7 seconds";
      case 8:
        return "7 minutes";
      case 9:
        return "7 hours";
      case 10:
        return "3 weeks";
      case 11:
        return "3 years";
      case 12:
        return "200 years";
      case 13:
        return "12k years";
      case 14:
        return "750k years";
      case 15:
        return "46m years";
      case 16:
        return "3bn years";
      case 17:
        return "179bn years";
      case 18:
        return "11tn years";
      default:
        time = "a lot of time";
    }
  }

  if (letterNumberSymbolRegex.test(password)) {
    if (passwordLength < 7) {
      return "instantly";
    }
    switch (passwordLength) {
      case 7:
        return "31 seconds";
      case 8:
        return "39 minutes";
      case 9:
        return "2 days";
      case 10:
        return "5 months";
      case 11:
        return "34 years";
      case 12:
        return "3k years";
      case 13:
        return "202k years";
      case 14:
        return "16m years";
      case 15:
        return "1bn years";
      case 16:
        return "92bn years";
      case 17:
        return "7tn years";
      case 18:
        return "438tn years";
      default:
        time = "a lot of time";
    }

    return time;
  }

  return "unknown";
}
