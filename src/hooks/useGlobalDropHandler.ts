/**
 * useGlobalDropHandler Hook
 *
 * Handles global drag-and-drop events for loading new volumes.
 * Integrates with useNewVolume to check for unsaved changes.
 */

import { useEffect, useRef, useState } from 'react';
import { useNewVolume } from './useNewVolume';

export function useGlobalDropHandler() {
  const { handleNewVolume } = useNewVolume();
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // NOTE: Store callback in ref to avoid effect re-runs
  // The effect cleanup/setup cycle was causing a race condition where drag events were missed
  const handleNewVolumeRef = useRef(handleNewVolume);

  // Keep ref updated with latest callback
  useEffect(() => {
    handleNewVolumeRef.current = handleNewVolume;
  }, [handleNewVolume]);

  useEffect(() => {
    // NOTE: Counter approach prevents false negatives when dragging over child elements,
    // since each child crossing fires dragenter/dragleave on the parent
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer?.types.includes('Files')) {
        dragCounter++;
        setIsDraggingFile(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'copy';
        }
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        setIsDraggingFile(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      setIsDraggingFile(false);

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

    // NOTE: Capture phase ensures our handlers run before any child element (e.g. Three.js
    // canvas, OrbitControls) can call stopPropagation() and swallow the event
    document.addEventListener('dragenter', handleDragEnter, true);
    document.addEventListener('dragover', handleDragOver, true);
    document.addEventListener('dragleave', handleDragLeave, true);
    document.addEventListener('drop', handleDrop, true);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter, true);
      document.removeEventListener('dragover', handleDragOver, true);
      document.removeEventListener('dragleave', handleDragLeave, true);
      document.removeEventListener('drop', handleDrop, true);
    };
  }, []); // Empty deps - set up listeners once, ref keeps callback fresh

  return { isDraggingFile };
}
