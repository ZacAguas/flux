/**
 * useNewVolume Hook
 *
 * Handles loading a new volume file with unsaved changes protection.
 * Shows confirmation modal if there are unsaved changes.
 */

import { useState } from 'react';
import { useViewerStore } from '../store/viewerStore';
import { parseNifti } from '../utils/niftiParser';
import { createVolumeTexture } from '../utils/volumeTextureConverter';
import { createVolumeReference, promptForVolumeFile } from '../utils/volumeReference';

export function useNewVolume() {
  const isDirty = useViewerStore((state) => state.isDirty);
  const setVolume = useViewerStore((state) => state.setVolume);
  const clearCurrentSession = useViewerStore((state) => state.clearCurrentSession);

  // Use store state instead of local state (shared with drag-and-drop)
  const showUnsavedModal = useViewerStore((state) => state.showNewVolumeUnsavedModal);
  const setShowUnsavedModal = useViewerStore((state) => state.setShowNewVolumeUnsavedModal);
  const pendingFile = useViewerStore((state) => state.pendingNewVolumeFile);
  const pendingFileHandle = useViewerStore((state) => state.pendingNewVolumeFileHandle);
  const setPendingFile = useViewerStore((state) => state.setPendingNewVolumeFile);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Trigger file picker to select a new volume.
   */
  const triggerFilePicker = async () => {
    try {
      const { file, fileHandle } = await promptForVolumeFile();
      handleNewVolume(file, fileHandle);
    } catch (err) {
      // User cancelled or error occurred
      if ((err as Error).message !== 'File selection cancelled') {
        setError((err as Error).message);
      }
    }
  };

  /**
   * Handle loading a new volume file.
   * Checks dirty state and shows confirmation if needed.
   */
  const handleNewVolume = (file: File, fileHandle?: FileSystemFileHandle) => {
    // Validate file extension
    if (!file.name.match(/\.(nii|nii\.gz)$/i)) {
      setError('Please select a valid NIfTI file (.nii or .nii.gz)');
      return;
    }

    // Check if there are unsaved changes
    if (isDirty) {
      setPendingFile(file, fileHandle);
      setShowUnsavedModal(true);
      return;
    }

    // No unsaved changes, proceed immediately
    loadVolumeFile(file, fileHandle);
  };

  /**
   * Actually load the volume file.
   */
  const loadVolumeFile = async (file: File, fileHandle?: FileSystemFileHandle) => {
    setIsLoading(true);
    setError(null);

    try {
      // PERF: Computing file hash adds ~50-200ms to load time for typical NIfTI files
      // Future optimization: Move hash computation to Web Worker to avoid blocking main thread
      const volumeReference = await createVolumeReference(file, fileHandle);
      const metadata = {
        fileName: volumeReference.fileName,
        fileSize: volumeReference.fileSize,
        fileHash: volumeReference.fileHash,
        lastModified: volumeReference.lastModified,
        fileHandle: volumeReference.fileHandle,
      };

      const volume = await parseNifti(file);
      const texture = createVolumeTexture(volume, 0);

      // Load volume and clear session state
      setVolume(volume, texture, metadata);
      clearCurrentSession();

      // Log 4D dataset info
      if (volume.dimensions.t && volume.dimensions.t > 1) {
        console.log(`4D dataset: ${volume.dimensions.t} time steps`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load file';
      setError(message);
      console.error('Error loading NIfTI file:', err);
      throw err; // Re-throw for caller
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle "Save" in unsaved changes modal.
   * Note: Actual save is handled by parent (needs useSaveSession hook).
   */
  const handleSave = () => {
    setShowUnsavedModal(false);
    // Return the pending file so parent can save first, then load it
    return { file: pendingFile, fileHandle: pendingFileHandle };
  };

  /**
   * Handle "Don't Save" in unsaved changes modal.
   */
  const handleDontSave = () => {
    setShowUnsavedModal(false);
    if (pendingFile) {
      loadVolumeFile(pendingFile, pendingFileHandle ?? undefined);
      setPendingFile(null);
    }
  };

  /**
   * Handle "Cancel" in unsaved changes modal.
   */
  const handleCancel = () => {
    setShowUnsavedModal(false);
    setPendingFile(null);
  };

  return {
    triggerFilePicker,
    handleNewVolume,
    loadVolumeFile,
    showUnsavedModal,
    isLoading,
    error,
    handleSave,
    handleDontSave,
    handleCancel,
  };
}
