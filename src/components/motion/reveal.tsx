"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { enterStyle, type EnterOptions } from "@/components/motion/enter-style";

type RevealProps = EnterOptions & {
  children: ReactNode;
  className?: string;
  /** Deel van het element dat zichtbaar moet zijn, gelijk aan framer-motion's viewport.amount. */
  amount?: number;
};

/**
 * Speelt de instap-animatie eenmalig af zodra het element in beeld komt.
 * Vervangt framer-motion's `whileInView` met `viewport={{ once: true }}`,
 * zonder die bibliotheek in de initiële bundle.
 */
export function Reveal({ children, className, amount = 0, ...enter }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: amount }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [amount]);

  return (
    <div
      ref={ref}
      className={className ? `reveal ${className}` : "reveal"}
      style={enterStyle(enter)}
      data-visible={visible ? "" : undefined}
    >
      {children}
    </div>
  );
}
