/**
 * useStateChangeTracking Hook
 *
 * Tracks changes to viewer state and marks as dirty when relevant changes occur.
 * Camera, slice, and window/level changes are handled by their respective UI components
 * (on interaction end) rather than here, to avoid debounce timing issues.
 */

import { useEffect, useRef } from 'react';
import { useViewerStore } from '../store/viewerStore';

export function useStateChangeTracking() {
  const markDirty = useViewerStore((state) => state.markDirty);

  // Track previous values to detect changes
  const prevValues = useRef({
    transferFunction: useViewerStore.getState().transferFunction,
    activePreset: useViewerStore.getState().activeTransferFunctionPreset,
    raymarchSettings: useViewerStore.getState().raymarchSettings,
    clippingPlanes: useViewerStore.getState().clippingPlanes,
    clippingVisualization: useViewerStore.getState().clippingPlaneVisualization,
    showSlicePlanes: useViewerStore.getState().showSlicePlanes,
    slicePlaneSettings: useViewerStore.getState().slicePlaneSettings,
    showCrosshairs: useViewerStore.getState().showCrosshairs,
    crosshairSettings: useViewerStore.getState().crosshairSettings,
    showMetricOverlays: useViewerStore.getState().showMetricOverlays,
  });

  useEffect(() => {
    const unsubscribe = useViewerStore.subscribe((state) => {
      const prev = prevValues.current;
      const isDirty = state.isDirty;

      // Helper for immediate property tracking
      const checkChange = <K extends keyof typeof prev>(currentValue: typeof prev[K], prevKey: K) => {
        if (currentValue !== prev[prevKey]) {
          if (!isDirty) markDirty();
          prev[prevKey] = currentValue;
        }
      };

      checkChange(state.transferFunction, 'transferFunction');
      checkChange(state.activeTransferFunctionPreset, 'activePreset');
      checkChange(state.raymarchSettings, 'raymarchSettings');
      checkChange(state.clippingPlanes, 'clippingPlanes');
      checkChange(state.clippingPlaneVisualization, 'clippingVisualization');
      checkChange(state.showSlicePlanes, 'showSlicePlanes');
      checkChange(state.slicePlaneSettings, 'slicePlaneSettings');
      checkChange(state.showCrosshairs, 'showCrosshairs');
      checkChange(state.crosshairSettings, 'crosshairSettings');
      checkChange(state.showMetricOverlays, 'showMetricOverlays');
    });

    return unsubscribe;
  }, [markDirty]);

  return null;
}
