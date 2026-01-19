/**
 * useLoadSession Hook
 *
 * Handles loading a saved session from IndexedDB.
 * Validates volume file and allows force-loading with mismatched files.
 * Supports FileSystemFileHandle permission flow for seamless session restoration.
 */

import { useState } from 'react';
import { useViewerStore } from '../store/viewerStore';
import { loadSession, listSessions, deleteSession } from '../utils/sessionStorage';
import {
  resolveVolumeFile,
  validateVolumeFile,
  promptForVolumeFile,
  requestFileHandleAccess,
} from '../utils/volumeReference';
import { deserializeViewerState, validateSessionVersion } from '../utils/stateSerializer';
import { parseNifti } from '../utils/niftiParser';
import { createVolumeTexture } from '../utils/volumeTextureConverter';
import type {
  SavedSessionMetadata,
  SessionError,
  VolumeValidationResult,
  ViewerSession,
} from '../types/session';

export function useLoadSession() {
  const isDirty = useViewerStore((state) => state.isDirty);
  const setVolume = useViewerStore((state) => state.setVolume);
  const setCurrentSession = useViewerStore((state) => state.setCurrentSession);
  const markClean = useViewerStore((state) => state.markClean);

  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [sessions, setSessions] = useState<SavedSessionMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<SessionError | null>(null);
  const [validationResult, setValidationResult] = useState<VolumeValidationResult | null>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingFileHandle, setPendingFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [pendingSession, setPendingSession] = useState<ViewerSession | null>(null);

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
   * Load volume and apply session state.
   */
  const finalizeLoad = async (
    file: File,
    session: ViewerSession,
    sessionId: string,
    fileHandle?: FileSystemFileHandle,
  ) => {
    // Parse volume
    const volume = await parseNifti(file);
    const texture = createVolumeTexture(volume, 0);

    // Extract metadata from saved session's volume reference
    // Include the fileHandle for future persistence
    const metadata = {
      fileName: session.volumeReference.fileName,
      fileSize: session.volumeReference.fileSize,
      fileHash: session.volumeReference.fileHash,
      lastModified: session.volumeReference.lastModified,
      fileHandle: fileHandle ?? session.volumeReference.fileHandle,
    };

    // Load volume
    setVolume(volume, texture, metadata);

    // Apply session state
    deserializeViewerState(session.viewerState, useViewerStore.getState());

    // Update current session
    const sessionMeta = sessions.find(s => s.id === sessionId);
    if (sessionMeta) {
      setCurrentSession(sessionId, sessionMeta.name);
    }

    markClean();
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

      // Resolve volume file
      let file: File;
      let fileHandle: FileSystemFileHandle | undefined;

      if (forceFile) {
        file = forceFile;
      } else {
        // Try to resolve using stored fileHandle
        const resolveResult = await resolveVolumeFile(session.volumeReference);

        if (resolveResult.file) {
          // File handle access succeeded
          file = resolveResult.file;
          fileHandle = resolveResult.fileHandle;
        } else if (resolveResult.needsPermission && resolveResult.fileHandle) {
          // Permission needed - show permission modal
          setPendingSessionId(sessionId);
          setPendingFileHandle(resolveResult.fileHandle);
          setPendingSession(session);
          setShowPermissionModal(true);
          setIsLoading(false);
          return; // Wait for user to grant permission
        } else {
          // No fileHandle or permission denied - prompt for file
          try {
            const pickerResult = await promptForVolumeFile();
            file = pickerResult.file;
            fileHandle = pickerResult.fileHandle;
          } catch (err) {
            if ((err as Error).message === 'File selection cancelled') {
              setIsLoading(false);
              return;
            }
            throw err;
          }
        }

        // Validate file matches reference
        const validation = await validateVolumeFile(file, session.volumeReference);

        if (!validation.isValid) {
          // File mismatch - show warning
          setValidationResult(validation);
          setPendingSessionId(sessionId);
          setPendingFile(file);
          setPendingFileHandle(fileHandle ?? null);
          setPendingSession(session);
          setError({
            type: 'file-mismatch',
            message: 'Volume file does not match session',
          });
          setShowErrorModal(true);
          setIsLoading(false);
          return; // Wait for user decision
        }
      }

      await finalizeLoad(file, session, sessionId, fileHandle);
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
   * Handle granting permission for file access.
   * MUST be called from a user gesture (button click).
   */
  const handleGrantPermission = async () => {
    if (!pendingFileHandle || !pendingSession || !pendingSessionId) {
      setShowPermissionModal(false);
      return;
    }

    setShowPermissionModal(false);
    setIsLoading(true);

    try {
      // Request permission (requires user gesture)
      const result = await requestFileHandleAccess(pendingFileHandle);

      if (result.file) {
        // Permission granted - validate and load
        const validation = await validateVolumeFile(result.file, pendingSession.volumeReference);

        if (!validation.isValid) {
          // File mismatch - show warning
          setValidationResult(validation);
          setPendingFile(result.file);
          setError({
            type: 'file-mismatch',
            message: 'Volume file does not match session',
          });
          setShowErrorModal(true);
          setIsLoading(false);
          return;
        }

        await finalizeLoad(result.file, pendingSession, pendingSessionId, pendingFileHandle);
        clearPendingState();
      } else if (result.status === 'denied') {
        // Permission denied - show error
        setError({
          type: 'permission-denied',
          message: 'File access permission was denied. Please select the file manually.',
        });
        setShowErrorModal(true);
        clearPendingState();
      } else {
        // User dismissed permission prompt
        setError({
          type: 'permission-dismissed',
          message: 'Permission request was dismissed. Please try again or select the file manually.',
        });
        setShowErrorModal(true);
      }
    } catch {
      setError({
        type: 'handle-invalid',
        message: 'Failed to access the file. It may have been moved or deleted.',
      });
      setShowErrorModal(true);
      clearPendingState();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle selecting a different file when permission is needed.
   */
  const handleSelectDifferentFile = async () => {
    if (!pendingSession || !pendingSessionId) {
      setShowPermissionModal(false);
      return;
    }

    setShowPermissionModal(false);
    setIsLoading(true);

    try {
      const { file, fileHandle } = await promptForVolumeFile();

      // Validate file matches reference
      const validation = await validateVolumeFile(file, pendingSession.volumeReference);

      if (!validation.isValid) {
        // File mismatch - show warning
        setValidationResult(validation);
        setPendingFile(file);
        setPendingFileHandle(fileHandle ?? null);
        setError({
          type: 'file-mismatch',
          message: 'Volume file does not match session',
        });
        setShowErrorModal(true);
        setIsLoading(false);
        return;
      }

      await finalizeLoad(file, pendingSession, pendingSessionId, fileHandle);
      clearPendingState();
    } catch (err) {
      if ((err as Error).message !== 'File selection cancelled') {
        setError({
          type: 'file-not-found',
          message: 'Failed to select file',
        });
        setShowErrorModal(true);
      }
      clearPendingState();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear all pending state.
   */
  const clearPendingState = () => {
    setPendingSessionId(null);
    setPendingFile(null);
    setPendingFileHandle(null);
    setPendingSession(null);
  };

  /**
   * Handle force load (when file mismatch).
   */
  const handleForceLoad = async () => {
    if (pendingSessionId && pendingFile && pendingSession) {
      setShowErrorModal(false);
      setIsLoading(true);

      try {
        await finalizeLoad(pendingFile, pendingSession, pendingSessionId, pendingFileHandle ?? undefined);
      } catch (err) {
        setError({
          type: 'unknown',
          message: 'Failed to load session',
        });
        setShowErrorModal(true);
        console.error('Error force loading session:', err);
      } finally {
        setIsLoading(false);
        clearPendingState();
      }
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
    clearPendingState();
    setValidationResult(null);
  };

  /**
   * Close permission modal.
   */
  const closePermissionModal = () => {
    setShowPermissionModal(false);
    clearPendingState();
  };

  return {
    openSessionPicker,
    handleLoadSession,
    handleDeleteSession,
    handleForceLoad,
    handleGrantPermission,
    handleSelectDifferentFile,
    showPickerModal,
    showUnsavedModal,
    showErrorModal,
    showPermissionModal,
    sessions,
    isLoading,
    error,
    validationResult,
    pendingFileName: pendingSession?.volumeReference.fileName ?? null,
    handleDontSave,
    handleCancelUnsaved,
    closeErrorModal,
    closePermissionModal,
    setShowPickerModal,
  };
}
