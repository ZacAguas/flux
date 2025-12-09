/**
 * Layout Dimensions Hook
 *
 * Manages the responsive dimensions of the layout area.
 * Handles:
 * - Window resize events
 * - Control panel state (open/pinned) to adjust available height
 */

import { useState, useEffect } from 'react';
import { useViewerStore } from '../store/viewerStore';

/**
 * Custom hook to get the current available dimensions for the viewer canvas.
 *
 * @returns Object containing current dimensions, panel height, and panel open state.
 */
export function useLayoutDimensions() {
  const controlPanelOpen = useViewerStore((state) => state.controlPanelOpen);
  const controlPanelPinned = useViewerStore((state) => state.controlPanelPinned);

  const panelHeight = controlPanelOpen && controlPanelPinned ? 204 : 0;
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight - panelHeight
  });

  useEffect(() => {
    const updateDimensions = () => {
      const height = window.innerHeight - panelHeight;
      const width = window.innerWidth;
      setDimensions({ width, height });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [panelHeight]);

  return { dimensions, panelHeight, controlPanelOpen };
}
