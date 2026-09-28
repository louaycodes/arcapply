"use client";

import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  HTMLAttributes,
  ElementType,
} from "react";
import type { GlassConfig, LiquidGlass as LiquidGlassInstance } from "@ybouane/liquidglass";

export type LiquidGlassConfig = Partial<GlassConfig>;

export interface LiquidGlassRootProps extends HTMLAttributes<HTMLDivElement> {
  defaults?: LiquidGlassConfig;
  children: React.ReactNode;
  className?: string;
  onReady?: (instance: LiquidGlassInstance) => void;
}

export interface LiquidGlassElementProps extends HTMLAttributes<HTMLElement> {
  config?: LiquidGlassConfig;
  children?: React.ReactNode;
  className?: string;
  as?: ElementType;
}

/**
 * Root container for LiquidGlass WebGL rendering.
 * All direct children with the attribute `data-liquid-glass="true"` will be treated as glass panels.
 * All other direct children (e.g. background graphics, ambient lights, cards) will be captured
 * and realistically refracted through the glass.
 */
export const LiquidGlassRoot = forwardRef<HTMLDivElement, LiquidGlassRootProps>(
  ({ defaults, children, className = "", onReady, ...props }, ref) => {
    const internalRef = useRef<HTMLDivElement | null>(null);
    const instanceRef = useRef<LiquidGlassInstance | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
      let isMounted = true;
      const rootEl = internalRef.current;
      if (!rootEl) return;

      const initLiquidGlass = async () => {
        try {
          const { LiquidGlass } = await import("@ybouane/liquidglass");
          if (!isMounted || !rootEl) return;

          // Find direct children marked as glass elements
          const glassEls = Array.from(
            rootEl.querySelectorAll<HTMLElement>(":scope > [data-liquid-glass='true']")
          );

          if (glassEls.length === 0) return;

          const instance = await LiquidGlass.init({
            root: rootEl,
            glassElements: glassEls,
            defaults: {
              refraction: 0.65,
              blurAmount: 0.15,
              chromAberration: 0.04,
              edgeHighlight: 0.12,
              specular: 0.08,
              fresnel: 0.85,
              cornerRadius: 28,
              zRadius: 32,
              shadowOpacity: 0.25,
              shadowSpread: 12,
              shadowOffsetY: 3,
              ...defaults,
            },
          });

          if (!isMounted) {
            instance.destroy();
            return;
          }

          instanceRef.current = instance;
          setIsReady(true);
          onReady?.(instance);
        } catch (error) {
          console.warn("LiquidGlass initialization note:", error);
        }
      };

      // Slight timeout to ensure layout, fonts, and DOM geometry are measured accurately
      const timer = setTimeout(initLiquidGlass, 80);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        if (instanceRef.current) {
          try {
            instanceRef.current.destroy();
          } catch {
            // Ignore teardown errors during fast HMR
          }
          instanceRef.current = null;
        }
      };
    }, [defaults, onReady]);

    return (
      <div
        ref={(node) => {
          internalRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={`relative ${className}`}
        data-liquid-glass-root="true"
        {...props}
      >
        {children}
      </div>
    );
  }
);

LiquidGlassRoot.displayName = "LiquidGlassRoot";

/**
 * Glass element that must be a DIRECT child of LiquidGlassRoot.
 */
export const LiquidGlassElement = forwardRef<HTMLElement, LiquidGlassElementProps>(
  ({ as: Component = "div", config, children, className = "", style, ...props }, ref) => {
    const configString = config ? JSON.stringify(config) : undefined;
    const cornerRadius = config?.cornerRadius ?? 28;

    return (
      <Component
        ref={ref}
        data-liquid-glass="true"
        data-config={configString}
        className={`relative transition-all select-none ${
          config?.floating ? "cursor-grab active:cursor-grabbing" : ""
        } ${className}`}
        style={{
          borderRadius: `${cornerRadius}px`,
          ...style,
        }}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

LiquidGlassElement.displayName = "LiquidGlassElement";

/**
 * Compact self-contained LiquidGlass badge with rich background glow.
 */
export function LiquidGlassBadge({
  children,
  className = "",
  glowClassName = "from-orange-500/30 via-amber-400/25 to-rose-500/25",
  floating = false,
}: {
  children: React.ReactNode;
  className?: string;
  glowClassName?: string;
  floating?: boolean;
}) {
  return (
    <LiquidGlassRoot className="inline-block relative">
      {/* Background layer captured by LiquidGlass */}
      <div
        className={`absolute -inset-1 rounded-full bg-gradient-to-r ${glowClassName} blur-sm opacity-80 pointer-events-none`}
      />
      <LiquidGlassElement
        config={{
          cornerRadius: 9999,
          zRadius: 20,
          refraction: 0.6,
          blurAmount: 0.15,
          edgeHighlight: 0.18,
          specular: 0.12,
          fresnel: 0.9,
          shadowOpacity: 0.18,
          floating,
        }}
        className={`px-3 py-1 text-xs font-semibold text-stone-900 border border-white/50 backdrop-blur-md shadow-sm ${className}`}
      >
        {children}
      </LiquidGlassElement>
    </LiquidGlassRoot>
  );
}
