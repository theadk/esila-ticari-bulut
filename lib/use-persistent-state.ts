import { safeSessionStorage } from './/storage';
import { useState, useEffect } from 'react';

export function usePersistentState<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.safeSessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn("Error reading sessionStorage", error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.safeSessionStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn("Error setting sessionStorage", error);
    }
  }, [key, state]);

  return [state, setState];
}
