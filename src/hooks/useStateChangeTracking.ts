/**
 * useStateChangeTracking Hook
 *
 * Tracks changes to viewer state and marks as dirty when relevant changes occur.
 * Debounces camera, slice, and window/level changes to avoid marking dirty on every pan.
 */

import { useEffect, useRef } from 'react';
import { useViewerStore } from '../store/viewerStore';

const DEBOUNCE_MS = 500;

export function useStateChangeTracking() {
  const markDirty = useViewerStore((state) => state.markDirty);

  // Refs to track debounced changes
  const debouncedCameraTimer = useRef<number | null>(null);
  const debouncedSliceTimer = useRef<number | null>(null);
  const debouncedWindowLevelTimer = useRef<number | null>(null);

  // Track previous values to detect changes
  const prevValues = useRef({
    // Immediate tracking (no debounce)
    layoutMode: useViewerStore.getState().layoutMode,
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

    // Debounced tracking
    volumeCameraState: useViewerStore.getState().volumeCameraState,
    sliceCameraState: useViewerStore.getState().sliceCameraState,
    sliceIndices: useViewerStore.getState().sliceIndices,
    windowLevel: useViewerStore.getState().windowLevel,
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

      // Immediate changes
      checkChange(state.layoutMode, 'layoutMode');
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

      // Helper for debounced property tracking
      const checkDebouncedChange = (
        changed: boolean,
        timerRef: React.RefObject<number | null>,
        updatePrev: () => void
      ) => {
        if (changed) {
          if (timerRef.current) window.clearTimeout(timerRef.current);
          timerRef.current = window.setTimeout(() => {
            if (!useViewerStore.getState().isDirty) markDirty();
            updatePrev();
          }, DEBOUNCE_MS);
        }
      };

      // Debounced changes - Camera
      checkDebouncedChange(
        state.volumeCameraState !== prev.volumeCameraState || state.sliceCameraState !== prev.sliceCameraState,
        debouncedCameraTimer,
        () => {
          prev.volumeCameraState = state.volumeCameraState;
          prev.sliceCameraState = state.sliceCameraState;
        }
      );

      // Debounced changes - Slices
      checkDebouncedChange(
        state.sliceIndices !== prev.sliceIndices,
        debouncedSliceTimer,
        () => { prev.sliceIndices = state.sliceIndices; }
      );

      // Debounced changes - Window/Level
      checkDebouncedChange(
        state.windowLevel !== prev.windowLevel,
        debouncedWindowLevelTimer,
        () => { prev.windowLevel = state.windowLevel; }
      );
    });

    return () => {
      unsubscribe();
      // Clear any pending timers
      [debouncedCameraTimer, debouncedSliceTimer, debouncedWindowLevelTimer].forEach(timer => {
        if (timer.current) window.clearTimeout(timer.current);
      });
    };
  }, [markDirty]);

  return null;
}
