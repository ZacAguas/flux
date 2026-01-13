/**
 * useGlobalDropHandler Hook
 *
 * Handles global drag-and-drop events for loading new volumes.
 * Integrates with useNewVolume to check for unsaved changes.
 */

import { useEffect } from 'react';
import { useNewVolume } from './useNewVolume';

export function useGlobalDropHandler() {
  const { handleNewVolume } = useNewVolume();

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

      // Use useNewVolume hook to handle file (includes dirty check)
      handleNewVolume(niftiFile);
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
  }, [handleNewVolume]);

  return null;
}
