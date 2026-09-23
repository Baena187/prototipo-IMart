import { useEffect } from 'react';

export function useKeyboardShortcut(key: string, handler: () => void, withMeta = true) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key.toLowerCase()) return;
      if (withMeta && !(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      handler();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [key, handler, withMeta]);
}
