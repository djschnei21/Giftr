"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef, type ElementType } from "react";

type InViewProps<T extends ElementType> = {
  as?: T;
  /** Keep observing and toggle `data-live`, so story loops pause while off screen. */
  live?: boolean;
  threshold?: number;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

/** Sets `data-in` once the element is about 30% visible, which starts its CSS intro. */
export function InView<T extends ElementType = "div">({ as, live = false, threshold = 0.3, ...props }: InViewProps<T>) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.dataset.in = "";
        if (live) {
          if (entry.isIntersecting) el.dataset.live = "";
          else delete el.dataset.live;
        } else if (entry.isIntersecting) {
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [live, threshold]);

  const Tag: ElementType = as ?? "div";
  return <Tag ref={ref} {...props} />;
}
