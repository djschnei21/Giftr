"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * Large statement whose words light up one at a time, in reading order, as the block
 * scrolls through the viewport. Progress is written to `--lit` so React never re-renders.
 */
export function TaglineReveal({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = lines.map((line) => line.split(" "));
  const total = words.flat().length;

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const { top, height } = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Starts as the block's top passes 85% of the viewport, finishes as its bottom passes 50%.
      const progress = (vh * 0.85 - top) / (vh * 0.35 + height);
      el.style.setProperty("--lit", String(Math.round(Math.min(1, Math.max(0, progress)) * total)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    el.style.setProperty("--lit", "0");
    update();
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
        onScroll();
      } else {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [total]);

  const starts = words.map((_, l) => words.slice(0, l).flat().length);
  return (
    <p ref={ref} className="tagline max-w-[680px] text-4xl font-bold tracking-tight text-balance sm:text-5xl">
      {words.map((line, l) => (
        <span key={l} className="block">
          {line.map((word, w) => (
            <span key={w}>
              <span className="tagline-word" style={{ "--i": starts[l] + w } as CSSProperties}>
                {word}
              </span>
              {w < line.length - 1 ? " " : null}
            </span>
          ))}
        </span>
      ))}
    </p>
  );
}
