// NOTE: adapted from https://reactbits.dev/backgrounds/threads to use a lighter weight 2D canvas
import { useEffect, useRef } from 'react';

const THREAD_COUNT = 22;
const SEGMENTS = 120;
// Teal: #13ddd1, Blue: #0a72f5
const COLOR_A: [number, number, number] = [0x13, 0xdd, 0xd1];
const COLOR_B: [number, number, number] = [0x0a, 0x72, 0xf5];

interface Thread {
  baseY: number;       // normalized 0-1
  amp1: number;        // primary amplitude (normalized)
  amp2: number;        // secondary amplitude
  freq1: number;       // primary frequency (cycles across width)
  freq2: number;       // secondary frequency
  phase: number;       // current phase
  phaseSpeed: number;  // phase increment per frame
  opacity: number;
  width: number;
  colorT: number;      // 0-1 position between COLOR_A and COLOR_B
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function buildThreads(height: number): Thread[] {
  return Array.from({ length: THREAD_COUNT }, (_, i) => {
    const t = i / (THREAD_COUNT - 1);
    const baseY = lerp(0.05, 0.95, t);
    return {
      baseY,
      amp1: lerp(0.03, 0.07, Math.abs(Math.sin(i * 1.3))) * height,
      amp2: lerp(0.01, 0.025, Math.abs(Math.cos(i * 2.1))) * height,
      freq1: lerp(1.0, 3.0, (i % 7) / 6),
      freq2: lerp(2.5, 6.0, (i % 5) / 4),
      phase: (i * Math.PI * 2 * 0.618) % (Math.PI * 2), // golden ratio spread
      phaseSpeed: lerp(0.003, 0.009, (i % 9) / 8),
      opacity: lerp(0.08, 0.28, Math.abs(Math.sin(i * 0.91))),
      width: lerp(0.5, 1.6, (i % 4) / 3),
      colorT: t,
    };
  });
}

export function ThreadsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let threads: Thread[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      threads = buildThreads(canvas.offsetHeight);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const draw = () => {
      ctx.clearRect(0, 0, W(), H());

      for (const thread of threads) {
        thread.phase += thread.phaseSpeed;

        const r = Math.round(lerp(COLOR_A[0], COLOR_B[0], thread.colorT));
        const g = Math.round(lerp(COLOR_A[1], COLOR_B[1], thread.colorT));
        const b = Math.round(lerp(COLOR_A[2], COLOR_B[2], thread.colorT));

        // Two passes: wide glow + sharp line
        for (let pass = 0; pass < 2; pass++) {
          ctx.beginPath();
          ctx.lineWidth = pass === 0 ? thread.width * 3 : thread.width;
          ctx.strokeStyle = `rgba(${r},${g},${b},${pass === 0 ? thread.opacity * 0.25 : thread.opacity})`;

          for (let j = 0; j <= SEGMENTS; j++) {
            const nx = j / SEGMENTS;
            const x = nx * W();
            const y =
              thread.baseY * H() +
              thread.amp1 * Math.sin(nx * Math.PI * 2 * thread.freq1 + thread.phase) +
              thread.amp2 * Math.sin(nx * Math.PI * 2 * thread.freq2 + thread.phase * 1.7);

            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
