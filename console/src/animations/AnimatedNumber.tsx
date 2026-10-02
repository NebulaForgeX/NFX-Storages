import { useEffect, useRef, useState } from "react";

export type AnimatedNumberProps = {
  value: number;
  /** 动画时长（毫秒） */
  durationMs?: number;
  className?: string;
};

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/** 数字从当前显示值平滑过渡到目标值（ease-out）；首次挂载从 0 起跳。 */
export function AnimatedNumber({ value, durationMs = 650, className }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef(0);
  const displayRef = useRef(0);

  useEffect(() => {
    displayRef.current = display;
  }, [display]);

  useEffect(() => {
    const from = displayRef.current;
    const to = value;
    if (from === to) return;

    const startedAt = performance.now();
    cancelAnimationFrame(frameRef.current);

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const next = Math.round(from + (to - from) * easeOutCubic(progress));
      setDisplay(next);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [durationMs, value]);

  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {display.toLocaleString()}
    </span>
  );
}
