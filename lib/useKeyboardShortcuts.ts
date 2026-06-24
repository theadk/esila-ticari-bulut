import { useEffect } from 'react';

type ShortcutMap = {
  [key: string]: () => void;
};

export const useKeyboardShortcuts = (shortcuts: ShortcutMap) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Create a string representation of the key combo
      const keys = [];
      if (e.ctrlKey || e.metaKey) keys.push('ctrl');
      if (e.altKey) keys.push('alt');
      if (e.shiftKey) keys.push('shift');
      keys.push(e.key.toLowerCase());
      
      const combo = keys.join('+');
      
      if (shortcuts[combo]) {
        e.preventDefault();
        shortcuts[combo]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
