/**
 * useGlobalDropHandler Hook
 *
 * Handles global drag-and-drop events for loading new volumes.
 * Integrates with useNewVolume to check for unsaved changes.
 */

import { useEffect, useRef } from 'react';
import { useNewVolume } from './useNewVolume';

export function useGlobalDropHandler() {
  const { handleNewVolume } = useNewVolume();

  // NOTE: Store callback in ref to avoid effect re-runs
  // The effect cleanup/setup cycle was causing a race condition where drag events were missed
  const handleNewVolumeRef = useRef(handleNewVolume);

  // Keep ref updated with latest callback
  useEffect(() => {
    handleNewVolumeRef.current = handleNewVolume;
  }, [handleNewVolume]);

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      // Check if dragged items include files
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        e.stopPropagation();

        // Show copy cursor
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'copy';
        }
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length === 0) return;

      // Only handle NIfTI files
      const niftiFile = files.find(f => f.name.match(/\.(nii|nii\.gz)$/i));
      if (!niftiFile) {
        console.warn('Dropped file is not a NIfTI file');
        return;
      }

      // Use latest version of handleNewVolume via ref
      handleNewVolumeRef.current(niftiFile);
    };

    // Prevent default drag behavior on document
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener('dragenter', preventDefaults);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', preventDefaults);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', preventDefaults);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', preventDefaults);
      document.removeEventListener('drop', handleDrop);
    };
  }, []); // Empty deps - set up listeners once, ref keeps callback fresh

  return null;
}
