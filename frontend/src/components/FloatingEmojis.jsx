import { useEffect, useRef } from 'react';

const EMOJIS = ['🍫', '🥤', '🧴', '🏠', '🍕', '🧼', '🧻', '🥛', '🧽', '🍪', '📦', '🛁'];
const COUNT = 20;
const REPEL_RADIUS = 140;

const FloatingEmojis = () => {
  const containerRef = useRef(null);
  const stateRef = useRef([]);
  const rafRef = useRef(null);
  const cursorRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const onMove = (e) => { cursorRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Evenly distribute x positions across screen to prevent clustering
    stateRef.current = Array.from({ length: COUNT }, (_, i) => {
      const baseX = ((i + 0.5) / COUNT) * w;
      const jitter = (Math.random() - 0.5) * (w / COUNT) * 0.85;
      return {
        x: baseX + jitter,
        y: h * 0.3 + Math.random() * h * 1.2,
        vx: (Math.random() - 0.5) * 0.28,
        vy: -(0.38 + Math.random() * 0.55),
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 0.7,
        pushX: 0,
        pushY: 0,
      };
    });

    const elements = Array.from(container.querySelectorAll('.fe-item'));

    const tick = () => {
      const cx = cursorRef.current.x;
      const cy = cursorRef.current.y;
      const rect = container.getBoundingClientRect();

      stateRef.current.forEach((s, i) => {
        const el = elements[i];
        if (!el) return;

        const ex = rect.left + s.x;
        const ey = rect.top + s.y;
        const dx = ex - cx;
        const dy = ey - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPEL_RADIUS && dist > 1) {
          const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * 2.5;
          s.pushX += (dx / dist) * force;
          s.pushY += (dy / dist) * force;
        }

        s.pushX *= 0.86;
        s.pushY *= 0.86;

        s.x += s.vx + s.pushX * 0.1;
        s.y += s.vy + s.pushY * 0.1;
        s.rotation += s.rotSpeed;

        if (s.x < -50) s.x = w + 30;
        if (s.x > w + 50) s.x = -30;

        if (s.y < -60) {
          const seg = ((i + 0.5) / COUNT) * w;
          s.x = seg + (Math.random() - 0.5) * (w / COUNT) * 0.85;
          s.y = h + 30 + Math.random() * 80;
          s.vx = (Math.random() - 0.5) * 0.28;
          s.vy = -(0.38 + Math.random() * 0.55);
          s.pushX = 0;
          s.pushY = 0;
        }

        el.style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.rotation}deg)`;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden', zIndex: 1 }}
    >
      {Array.from({ length: COUNT }, (_, i) => (
        <div
          key={i}
          className="fe-item"
          style={{
            position: 'absolute', top: 0, left: 0,
            fontSize: `${1.3 + (i % 4) * 0.35}rem`,
            opacity: 0.15 + (i % 5) * 0.04,
            willChange: 'transform',
            userSelect: 'none',
            lineHeight: 1,
          }}
        >
          {EMOJIS[i % EMOJIS.length]}
        </div>
      ))}
    </div>
  );
};

export default FloatingEmojis;
