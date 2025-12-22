/**
 * Slice View Keyboard Shortcuts Hook
 *
 * Provides keyboard shortcuts for slice view camera controls:
 * - R key: Reset all slice cameras to default view (fit-to-viewport)
 */

import { useEffect } from 'react';
import { useViewerStore } from '../store/viewerStore';

export function useSliceViewKeyboardShortcuts() {
  const resetAllSliceCameras = useViewerStore((state) => state.resetAllSliceCameras);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Reset all slice cameras when 'R' key is pressed (not Ctrl+R, which is browser refresh)
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        // Only trigger if not typing in an input field
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          resetAllSliceCameras();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [resetAllSliceCameras]);
}
