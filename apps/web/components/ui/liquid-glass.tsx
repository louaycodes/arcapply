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
 * All other direct children will be captured and realistically refracted through the glass.
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
              cornerRadius: 24,
              zRadius: 28,
              shadowOpacity: 0.2,
              shadowSpread: 10,
              shadowOffsetY: 2,
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
    const cornerRadius = config?.cornerRadius ?? 24;

    return (
      <Component
        ref={ref}
        data-liquid-glass="true"
        data-config={configString}
        className={`relative transition-all ${
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
 * Premium Glassmorphism Card for Core UI Surfaces.
 * GPU-accelerated, zero-lag, instant 60/120 FPS rendering.
 */
export function GlassCard({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-artisan ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Premium Glass Pill / Badge.
 */
export function GlassPill({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-white/70 border border-white/80 shadow-xs ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
