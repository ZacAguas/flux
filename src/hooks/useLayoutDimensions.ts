/**
 * Layout Dimensions Hook
 *
 * Returns the actual pixel dimensions of the canvas area (PersistentLayout container),
 * accounting for the icon rail, side panel, and mobile bottom bar.
 */

import { useState, useEffect } from 'react';
import { useViewerStore } from '../store/viewerStore';
import { useBreakpoint, getBreakpoint, RAIL_WIDTH, PANEL_WIDTH, MOBILE_BAR_H } from '../utils/uiLayout';
import type { Breakpoint } from '../utils/uiLayout';

function computeDimensions(bp: Breakpoint, panelOpen: boolean) {
  const railW  = bp === 'mobile' ? 0 : RAIL_WIDTH;
  // On tablet the panel overlays the canvas, so doesn't reduce width
  const panelW = bp === 'desktop' && panelOpen ? PANEL_WIDTH : 0;
  const barH   = bp === 'mobile' ? MOBILE_BAR_H : 0;
  return {
    width:  window.innerWidth  - railW - panelW,
    height: window.innerHeight - barH,
  };
}

export function useLayoutDimensions() {
  const panelOpen = useViewerStore((state) => state.activeSections.length > 0);

  // useBreakpoint owns the bp state and the resize listener for breakpoint changes
  const bp = useBreakpoint();
  const [dimensions, setDimensions] = useState(() => computeDimensions(bp, panelOpen));

  useEffect(() => {
    const update = () => setDimensions(computeDimensions(getBreakpoint(), panelOpen));
    update(); // sync when panelOpen changes
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [panelOpen]);

  return { dimensions, bp };
}
