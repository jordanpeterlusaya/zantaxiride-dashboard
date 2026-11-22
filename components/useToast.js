'use client';

import { useCallback, useState } from 'react';

export function useToast() {
  const [message, setMessage] = useState('');
  const show = useCallback((msg) => {
    setMessage(msg);
    window.clearTimeout(window.__ztrToast);
    window.__ztrToast = window.setTimeout(() => setMessage(''), 2200);
  }, []);
  return { message, show };
}
