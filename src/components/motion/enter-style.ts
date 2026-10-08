import type { CSSProperties } from "react";

export type EnterOptions = {
  x?: number;
  y?: number;
  scale?: number;
  /** Seconden, zoals de oude framer-motion transition. */
  duration?: number;
  delay?: number;
};

/** Zet de beginpositie en timing voor de `.enter`/`.reveal` keyframes. */
export function enterStyle({
  x = 0,
  y = 0,
  scale = 1,
  duration = 0.55,
  delay = 0,
}: EnterOptions): CSSProperties {
  return {
    "--enter-x": `${x}px`,
    "--enter-y": `${y}px`,
    "--enter-scale": scale,
    "--enter-duration": `${duration}s`,
    "--enter-delay": `${delay}s`,
  } as CSSProperties;
}
