import { useState, useEffect, useRef, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { UnlistenFn } from "@tauri-apps/api/event";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

export const useTheme = () => {
  const [theme, setTheme] = useState<"light" | "dark" | "inherit">("inherit");

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    (async () => {
      setTheme((await getCurrentWindow().theme()) || "inherit");

      unlisten = await getCurrentWindow().onThemeChanged(
        ({ payload: theme }) => {
          console.log(`theme changed to ${theme}`);
          setTheme(theme);
        }
      );
    })();

    return () => {
      if (unlisten != null) {
        unlisten();
      }
    };
  }, []);

  return theme;
};

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

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });
  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };
  return [storedValue, setValue] as const;
}
