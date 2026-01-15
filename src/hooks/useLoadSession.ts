/**
 * useLoadSession Hook
 *
 * Handles loading a saved session from IndexedDB.
 * Validates volume file and allows force-loading with mismatched files.
 */

import { useState } from 'react';
import { useViewerStore } from '../store/viewerStore';
import { loadSession, listSessions, deleteSession } from '../utils/sessionStorage';
import { resolveVolumeFile, validateVolumeFile } from '../utils/volumeReference';
import { deserializeViewerState, validateSessionVersion } from '../utils/stateSerializer';
import { parseNifti } from '../utils/niftiParser';
import { createVolumeTexture } from '../utils/volumeTextureConverter';
import type { SavedSessionMetadata, SessionError, VolumeValidationResult } from '../types/session';

export function useLoadSession() {
  const isDirty = useViewerStore((state) => state.isDirty);
  const setVolume = useViewerStore((state) => state.setVolume);
  const setCurrentSession = useViewerStore((state) => state.setCurrentSession);
  const markClean = useViewerStore((state) => state.markClean);

  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [sessions, setSessions] = useState<SavedSessionMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<SessionError | null>(null);
  const [validationResult, setValidationResult] = useState<VolumeValidationResult | null>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  /**
   * Open the session picker modal.
   */
  const openSessionPicker = async () => {
    // Check for unsaved changes
    if (isDirty) {
      setShowUnsavedModal(true);
      return;
    }

    await refreshSessionList();
    setShowPickerModal(true);
  };

  /**
   * Refresh the list of sessions.
   */
  const refreshSessionList = async () => {
    try {
      const sessionList = await listSessions(true); // Include auto-save
      setSessions(sessionList);
    } catch (err) {
      console.error('Failed to list sessions:', err);
    }
  };

  /**
   * Handle loading a session.
   */
  const handleLoadSession = async (sessionId: string) => {
    setShowPickerModal(false);
    await performLoad(sessionId);
  };

  /**
   * Perform the actual load operation.
   */
  const performLoad = async (sessionId: string, forceFile?: File) => {
    setIsLoading(true);
    setError(null);
    setValidationResult(null);

    try {
      // Load session from IndexedDB
      const session = await loadSession(sessionId);

      // Validate version
      if (!validateSessionVersion(session.version)) {
        throw {
          type: 'version-mismatch',
          message: `Incompatible session version: ${session.version}`,
        } as SessionError;
      }

      // Resolve volume file (try handle first, then prompt)
      let file: File;
      if (forceFile) {
        file = forceFile;
      } else {
        const result = await resolveVolumeFile(session.volumeReference);
        file = result.file;

        // Validate file matches reference
        const validation = await validateVolumeFile(file, session.volumeReference);

        if (!validation.isValid) {
          // File mismatch - show warning
          setValidationResult(validation);
          setPendingSessionId(sessionId);
          setPendingFile(file);
          setError({
            type: 'file-mismatch',
            message: 'Volume file does not match session',
          });
          setShowErrorModal(true);
          return; // Wait for user decision
        }
      }

      // Parse volume
      const volume = await parseNifti(file);
      const texture = createVolumeTexture(volume, 0);

      // Extract metadata from saved session's volume reference
      const metadata = {
        fileName: session.volumeReference.fileName,
        fileSize: session.volumeReference.fileSize,
        fileHash: session.volumeReference.fileHash,
        lastModified: session.volumeReference.lastModified,
      };

      // Load volume
      setVolume(volume, texture, file.name, metadata);

      // Apply session state
      deserializeViewerState(session.viewerState, useViewerStore.getState());

      // Update current session
      const sessionMeta = sessions.find(s => s.id === sessionId);
      if (sessionMeta) {
        setCurrentSession(sessionId, sessionMeta.name);
      }

      markClean();

      console.log('Session loaded successfully');
    } catch (err) {
      const sessionError = err as SessionError;
      setError(sessionError);
      setShowErrorModal(true);
      console.error('Error loading session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle force load (when file mismatch).
   */
  const handleForceLoad = () => {
    if (pendingSessionId && pendingFile) {
      setShowErrorModal(false);
      performLoad(pendingSessionId, pendingFile);
      setPendingSessionId(null);
      setPendingFile(null);
    }
  };

  /**
   * Handle delete session.
   */
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      await refreshSessionList();
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  /**
   * Handle "Don't Save" in unsaved modal.
   */
  const handleDontSave = async () => {
    setShowUnsavedModal(false);
    await refreshSessionList();
    setShowPickerModal(true);
  };

  /**
   * Handle "Cancel" in unsaved modal.
   */
  const handleCancelUnsaved = () => {
    setShowUnsavedModal(false);
  };

  /**
   * Close error modal.
   */
  const closeErrorModal = () => {
    setShowErrorModal(false);
    setPendingSessionId(null);
    setPendingFile(null);
    setValidationResult(null);
  };

  return {
    openSessionPicker,
    handleLoadSession,
    handleDeleteSession,
    handleForceLoad,
    showPickerModal,
    showUnsavedModal,
    showErrorModal,
    sessions,
    isLoading,
    error,
    validationResult,
    handleDontSave,
    handleCancelUnsaved,
    closeErrorModal,
    setShowPickerModal,
  };
}
