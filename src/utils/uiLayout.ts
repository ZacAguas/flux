import { useState, useEffect } from 'react';
import type { NiftiVolume } from '../types/nifti';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';
export type SectionId = 'file' | 'volume' | 'crop' | 'slices' | 'playback' | 'display' | 'transfer' | 'measure';

export const RAIL_WIDTH    = 48;
export const PANEL_WIDTH   = 272;
export const MOBILE_BAR_H  = 60;
export const BP_TABLET     = 680;
export const BP_DESKTOP    = 1100;
export const ACCENT_COLOR  = '#13ddd1';
export const springWidth   = { type: 'spring' as const, stiffness: 420, damping: 38, mass: 0.7 };

export function inject4D<T>(base: T[], insert: T, is4D: boolean, at: number): T[] {
  if (!is4D) return base;
  return [...base.slice(0, at), insert, ...base.slice(at)];
}

export function getBreakpoint(): Breakpoint {
  const w = window.innerWidth;
  if (w < BP_TABLET)  return 'mobile';
  if (w < BP_DESKTOP) return 'tablet';
  return 'desktop';
}

export function selectIs4D(state: { volume: NiftiVolume | null }): boolean {
  return Boolean(state.volume?.dimensions.t && state.volume.dimensions.t > 1);
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(getBreakpoint);

  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    const update = () => {
      clearTimeout(id);
      id = setTimeout(() => setBp(getBreakpoint()), 80);
    };
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('resize', update); clearTimeout(id); };
  }, []);

  return bp;
}
