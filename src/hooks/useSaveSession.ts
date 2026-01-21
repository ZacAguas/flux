/**
 * useSaveSession Hook
 *
 * Handles saving the current viewer state to IndexedDB.
 * Flushes pending debounced updates before saving.
 */

import { useState } from 'react';
import { useViewerStore } from '../store/viewerStore';
import { serializeViewerState, getCurrentVersion } from '../utils/stateSerializer';
import { createVolumeReference } from '../utils/volumeReference';
import { saveSession } from '../utils/sessionStorage';
import type { ViewerSession } from '../types/session';

export function useSaveSession() {
  const currentSessionId = useViewerStore((state) => state.currentSessionId);
  const currentSessionName = useViewerStore((state) => state.currentSessionName);
  const volume = useViewerStore((state) => state.volume);
  const setCurrentSession = useViewerStore((state) => state.setCurrentSession);
  const markClean = useViewerStore((state) => state.markClean);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  /**
   * Quick save to current session (or prompt for name if new).
   */
  const quickSave = async (file?: File) => {
    if (currentSessionId && currentSessionName) {
      // Update existing session
      await performSave(currentSessionName, currentSessionId, file);
    } else {
      // New session, prompt for name
      setPendingFile(file || null);
      setShowSaveModal(true);
    }
  };

  /**
   * Save as new session (always prompt for name).
   */
  const saveAs = (file?: File) => {
    setPendingFile(file || null);
    setShowSaveModal(true);
  };

  /**
   * Perform the actual save operation.
   */
  const performSave = async (name: string, id?: string, file?: File) => {
    if (!volume) {
      setError('No volume loaded');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // NOTE: Flush pending debounced updates by reading directly from store
      // The store is already up to date since we're accessing it synchronously
      const viewerState = serializeViewerState(useViewerStore.getState());

      // Create volume reference from the provided file or use stored metadata
      let volumeReference;
      if (file) {
        volumeReference = await createVolumeReference(file);
      } else {
        // Use stored metadata from when the volume was loaded
        const metadata = useViewerStore.getState().volumeFileMetadata;

        if (!metadata) {
          throw new Error('No volume metadata available. Cannot save session.');
        }

        volumeReference = {
          fileName: metadata.fileName,
          fileSize: metadata.fileSize,
          lastModified: metadata.lastModified,
          fileHash: metadata.fileHash,
          // Include fileHandle if available for persistent file access
          fileHandle: metadata.fileHandle,
        };
      }

      const session: ViewerSession = {
        version: getCurrentVersion(),
        timestamp: Date.now(),
        volumeReference,
        viewerState,
      };

      // Capture thumbnail before saving
      const captureFn = useViewerStore.getState().captureCanvasThumbnail;
      const thumbnail = captureFn?.() ?? undefined;

      const metadata = await saveSession(session, name, false, id, thumbnail);

      // Update current session in store
      setCurrentSession(metadata.id, name);
      markClean();

      console.log('Session saved:', name);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save session';
      setError(message);
      console.error('Error saving session:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle save from modal.
   */
  const handleSaveFromModal = async (name: string) => {
    setShowSaveModal(false);
    await performSave(name, undefined, pendingFile || undefined);
    setPendingFile(null);
  };

  /**
   * Handle cancel from modal.
   */
  const handleCancelSave = () => {
    setShowSaveModal(false);
    setPendingFile(null);
  };

  return {
    quickSave,
    saveAs,
    performSave,
    showSaveModal,
    isSaving,
    error,
    handleSaveFromModal,
    handleCancelSave,
  };
}
