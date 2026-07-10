"use client";

import { useEffect, useState } from "react";

/**
 * True when the device can reliably hover (mouse/trackpad).
 * False on touch-primary devices — use tap/click affordances instead.
 */
export function useHoverCapable(): boolean {
  const [capable, setCapable] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCapable(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return capable;
}
