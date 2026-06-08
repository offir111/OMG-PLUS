import { useState, useEffect, useRef } from 'react';

/**
 * Typewriter effect — מציג טקסט אות אות כמו מכונת כתיבה.
 * charsPerFrame: 3 = מהירות בינונית (~180 תווים לשנייה על 60fps)
 */
export function useTypewriter(text, charsPerFrame = 3) {
  const [displayed, setDisplayed] = useState('');
  const rafRef = useRef(null);
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (!text) { setDisplayed(''); return; }
    setDisplayed('');
    let idx = 0;
    const full = text;
    function tick() {
      idx = Math.min(idx + charsPerFrame, full.length);
      setDisplayed(full.slice(0, idx));
      if (idx < full.length) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [text]);

  const isDone = !text || displayed.length >= text.length;
  return { displayed, isDone };
}
