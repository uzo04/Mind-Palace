import { useEffect, useState } from 'react';

export function readAutosave(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? { ...fallback, ...JSON.parse(saved) } : fallback;
  } catch {
    return fallback;
  }
}

export function clearAutosave(key) {
  localStorage.removeItem(key);
}

export function useAutosave(key, value, { enabled = true, delay = 700 } = {}) {
  const [status, setStatus] = useState('idle');
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    if (!enabled || !key) return undefined;

    setStatus('saving');
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        setSavedAt(new Date());
        setStatus('saved');
      } catch {
        setStatus('error');
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [key, value, enabled, delay]);

  return { status, savedAt };
}
