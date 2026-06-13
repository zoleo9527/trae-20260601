import { useEffect, useState } from 'react';

interface Props {
  value: number;
  duration?: number;
  className?: string;
}

export default function AnimatedNumber({ value, duration = 700, className = '' }: Props) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * ease));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={`tabular-nums ${className}`}>{display}</span>;
}
