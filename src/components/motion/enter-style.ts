import type { CSSProperties } from "react";

export type EnterOptions = {
  x?: number;
  y?: number;
  scale?: number;
  /** Seconden, zoals de oude framer-motion transition. */
  duration?: number;
  delay?: number;
  /**
   * Zet uit voor het LCP-element: Chrome telt een tekstblok dat vanaf
   * opacity 0 infadet pas als LCP wanneer de animatie klaar is.
   */
  fade?: boolean;
};

/** Zet de beginpositie en timing voor de `.enter`/`.reveal` keyframes. */
export function enterStyle({
  x = 0,
  y = 0,
  scale = 1,
  duration = 0.55,
  delay = 0,
  fade = true,
}: EnterOptions): CSSProperties {
  return {
    "--enter-opacity": fade ? 0 : 1,
    "--enter-x": `${x}px`,
    "--enter-y": `${y}px`,
    "--enter-scale": scale,
    "--enter-duration": `${duration}s`,
    "--enter-delay": `${delay}s`,
  } as CSSProperties;
}
