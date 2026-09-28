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
import { Sparkles, Move, Eye, Layers } from "lucide-react";

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
 * Optimized, high-performance LiquidGlass interactive showcase island.
 * Isolated so that heavy DOM trees and global pages are never blocked.
 */
export function LiquidGlassShowcase() {
  const [activePreset, setActivePreset] = useState<"pill" | "dome" | "frosted">("pill");

  const presetConfig: Record<string, LiquidGlassConfig> = {
    pill: {
      floating: true,
      cornerRadius: 9999,
      zRadius: 28,
      refraction: 0.8,
      blurAmount: 0.05,
      chromAberration: 0.07,
      edgeHighlight: 0.2,
      specular: 0.15,
      fresnel: 0.9,
    },
    dome: {
      floating: true,
      bevelMode: 1,
      cornerRadius: 36,
      zRadius: 36,
      refraction: 1.25,
      blurAmount: 0.0,
      chromAberration: 0.1,
      edgeHighlight: 0.25,
      specular: 0.2,
    },
    frosted: {
      floating: true,
      cornerRadius: 24,
      zRadius: 20,
      refraction: 0.45,
      blurAmount: 0.35,
      chromAberration: 0.03,
      edgeHighlight: 0.15,
      specular: 0.08,
    },
  };

  return (
    <div className="rounded-3xl border border-[#E7DFD4] bg-white p-6 sm:p-8 shadow-artisan-card space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-900 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Moteur Optique WebGL & Shaders</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-stone-900 font-display">
            Module Réfraction LiquidGlass en Temps Réel
          </h3>
          <p className="text-xs sm:text-sm text-stone-600">
            Déplacez la lentille ci-dessous pour observer la distorsion optique, la dispersion chromatique et les reflets de Fresnel.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setActivePreset("pill")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activePreset === "pill"
                ? "bg-white text-stone-900 shadow-xs border border-stone-200/80"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Pillule Bombée
          </button>
          <button
            type="button"
            onClick={() => setActivePreset("dome")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activePreset === "dome"
                ? "bg-white text-stone-900 shadow-xs border border-stone-200/80"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Loupe Dôme
          </button>
          <button
            type="button"
            onClick={() => setActivePreset("frosted")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activePreset === "frosted"
                ? "bg-white text-stone-900 shadow-xs border border-stone-200/80"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Verre Dépoli
          </button>
        </div>
      </div>

      {/* Interactive Canvas Stage */}
      <LiquidGlassRoot
        className="relative overflow-hidden rounded-2xl h-56 border border-stone-200/80 flex items-center justify-center select-none"
        defaults={presetConfig[activePreset]}
      >
        {/* NON-GLASS SIBLING: Graphic Backdrop with high-contrast shapes */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-around overflow-hidden p-6 bg-gradient-to-r from-orange-50 via-amber-50 to-rose-50">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 shadow-lg shadow-orange-500/20" />
          <div className="space-y-2 text-center">
            <span className="font-display font-extrabold text-3xl sm:text-4xl text-stone-900 tracking-tight block">
              ArcApply 2027
            </span>
            <span className="text-xs font-mono font-medium text-orange-800 bg-orange-200/60 px-2 py-0.5 rounded-full inline-block">
              RÉFRACTION WEBGL 60 FPS
            </span>
          </div>
          <div className="w-24 h-24 rounded-2xl rotate-12 bg-gradient-to-br from-rose-500 to-orange-400 shadow-lg shadow-rose-500/20" />
        </div>

        {/* GLASS ELEMENT: Draggable Interactive Lens (Direct Child) */}
        <LiquidGlassElement
          key={activePreset}
          config={presetConfig[activePreset]}
          className="z-20 px-6 py-3 border border-white/80 bg-white/10 shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-stone-950 font-bold text-sm"
        >
          <Move className="w-4 h-4 text-orange-600 animate-pulse" />
          <span>Lentille Active — Déplacez-moi</span>
        </LiquidGlassElement>
      </LiquidGlassRoot>
    </div>
  );
}
