import { useEffect, useState } from 'react';

/**
 * Delays reflecting `value` until it's stopped changing for `delayMs` -
 * used to keep Search from firing a network request on every keystroke.
 * Self-contained (no external debounce dependency) since this is the only
 * place in the app that currently needs one.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
