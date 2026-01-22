/**
 * Measurement Keyboard Shortcuts Hook
 *
 * Provides keyboard shortcuts for measurement tools:
 * - D: Toggle distance tool
 * - A: Toggle angle tool
 * - Escape: Cancel current measurement/deselect/deactivate tool
 * - Delete/Backspace: Delete selected measurement
 */

import { useEffect } from 'react';
import { useViewerStore } from '../store/viewerStore';

export function useMeasurementKeyboardShortcuts() {
  const activeTool = useViewerStore((state) => state.activeTool);
  const setActiveTool = useViewerStore((state) => state.setActiveTool);
  const activeMeasurementId = useViewerStore((state) => state.activeMeasurementId);
  const selectedMeasurementId = useViewerStore((state) => state.selectedMeasurementId);
  const cancelMeasurement = useViewerStore((state) => state.cancelMeasurement);
  const deleteMeasurement = useViewerStore((state) => state.deleteMeasurement);
  const setSelectedMeasurement = useViewerStore((state) => state.setSelectedMeasurement);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Don't trigger if modifier keys are pressed (except for Escape)
      const hasModifier = e.ctrlKey || e.metaKey || e.altKey;

      switch (e.key) {
        case 'd':
        case 'D':
          if (!hasModifier) {
            e.preventDefault();
            setActiveTool(activeTool === 'distance' ? 'none' : 'distance');
          }
          break;

        case 'a':
        case 'A':
          // Don't use 'a' if Ctrl is pressed (select all)
          if (!hasModifier) {
            e.preventDefault();
            // Toggle angle tool
            setActiveTool(activeTool === 'angle' ? 'none' : 'angle');
          }
          break;

        case 'Escape':
          e.preventDefault();
          // Cancel in-progress measurement first
          if (activeMeasurementId) {
            cancelMeasurement();
          }
          // Then deselect any selected measurement
          else if (selectedMeasurementId) {
            setSelectedMeasurement(null);
          }
          // Finally deactivate tool
          else if (activeTool !== 'none') {
            setActiveTool('none');
          }
          break;

        case 'Delete':
        case 'Backspace':
          if (!hasModifier && selectedMeasurementId) {
            e.preventDefault();
            deleteMeasurement(selectedMeasurementId);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    activeTool,
    setActiveTool,
    activeMeasurementId,
    selectedMeasurementId,
    cancelMeasurement,
    deleteMeasurement,
    setSelectedMeasurement,
  ]);
}
