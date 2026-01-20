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
import { promptForVolumeFile } from '../utils/volumeReference';
import { validateSessionVersion } from '../utils/stateSerializer';
import {
  resolveSessionFile,
  requestSessionFileAccess,
  loadSessionWithFile,
} from '../utils/sessionLoader';
import type {
  SavedSessionMetadata,
  SessionError,
  VolumeValidationResult,
  ViewerSession,
} from '../types/session';

export function useLoadSession() {
  const isDirty = useViewerStore((state) => state.isDirty);
  const setCurrentSession = useViewerStore((state) => state.setCurrentSession);
  const clearCurrentSession = useViewerStore((state) => state.clearCurrentSession);
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
  // Track whether current operation is a JSON import flow
  const [isImportFlow, setIsImportFlow] = useState(false);

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

  const tryLoadSession = async (
    file: File,
    session: ViewerSession,
    sessionId: string | null,
    fileHandle?: FileSystemFileHandle,
    skipValidation = false,
  ): Promise<boolean> => {
    const result = await loadSessionWithFile(file, session, fileHandle, skipValidation);

    if (result.status === 'validation-failed') {
      setPendingFile(result.file);
      setPendingFileHandle(result.fileHandle ?? null);
      setPendingSessionId(sessionId);
      setPendingSession(session);
      setValidationResult(result.validation);
      setError({ type: 'file-mismatch', message: 'Volume file does not match session' });
      setShowErrorModal(true);
      return false;
    }

    if (result.status === 'error') {
      setError({ type: 'unknown', message: 'Failed to load session' });
      setShowErrorModal(true);
      console.error('Failed to load session:', result.error);
      return false;
    }

    // Set current session for IndexedDB loads, clear for JSON imports
    if (sessionId) {
      const sessionMeta = sessions.find(s => s.id === sessionId);
      if (sessionMeta) {
        setCurrentSession(sessionId, sessionMeta.name);
      }
    } else {
      clearCurrentSession();
    }

    markClean();
    return true;
  };

  const performLoadFromJSON = async (session: ViewerSession) => {
    setIsLoading(true);
    setError(null);
    setValidationResult(null);

    try {
      if (!validateSessionVersion(session.version)) {
        throw { type: 'version-mismatch', message: `Incompatible session version: ${session.version}` } as SessionError;
      }

      const pickerResult = await promptForVolumeFile();

      if (await tryLoadSession(pickerResult.file, session, null, pickerResult.fileHandle)) {
        setIsImportFlow(false);
      }
    } catch (err) {
      if ((err as Error).message === 'File selection cancelled') {
        setIsImportFlow(false);
        return;
      }
      setError(err as SessionError);
      setShowErrorModal(true);
      console.error('Error loading session from JSON:', err);
      setIsImportFlow(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load session from parsed JSON.
   * Entry point for JSON import flow.
   */
  const loadFromJSON = async (session: ViewerSession) => {
    setIsImportFlow(true);

    // Check for unsaved changes
    if (isDirty) {
      setPendingSession(session);
      setPendingSessionId(null); // Mark as JSON import
      setShowUnsavedModal(true);
      return;
    }

    await performLoadFromJSON(session);
  };

  const performLoad = async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    setValidationResult(null);

    try {
      const session = await loadSession(sessionId);

      if (!validateSessionVersion(session.version)) {
        throw { type: 'version-mismatch', message: `Incompatible session version: ${session.version}` } as SessionError;
      }

      const resolveResult = await resolveSessionFile(session);

      if (resolveResult.status === 'resolved') {
        await tryLoadSession(resolveResult.file, session, sessionId, resolveResult.fileHandle);
      } else if (resolveResult.status === 'needs-permission') {
        setPendingSessionId(sessionId);
        setPendingFileHandle(resolveResult.fileHandle);
        setPendingSession(session);
        setShowPermissionModal(true);
      } else {
        const pickerResult = await promptForVolumeFile();
        await tryLoadSession(pickerResult.file, session, sessionId, pickerResult.fileHandle);
      }
    } catch (err) {
      if ((err as Error).message === 'File selection cancelled') {
        return;
      }
      setError(err as SessionError);
      setShowErrorModal(true);
      console.error('Error loading session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantPermission = async () => {
    if (!pendingFileHandle || !pendingSession || !pendingSessionId) {
      setShowPermissionModal(false);
      return;
    }

    setShowPermissionModal(false);
    setIsLoading(true);

    try {
      const result = await requestSessionFileAccess(pendingFileHandle);

      if (result.file) {
        if (await tryLoadSession(result.file, pendingSession, pendingSessionId, pendingFileHandle)) {
          clearPendingState();
        }
      } else if (result.denied) {
        setError({ type: 'permission-denied', message: 'File access permission was denied. Please select the file manually.' });
        setShowErrorModal(true);
        clearPendingState();
      } else {
        setError({ type: 'permission-dismissed', message: 'Permission request was dismissed. Please try again or select the file manually.' });
        setShowErrorModal(true);
      }
    } catch {
      setError({ type: 'handle-invalid', message: 'Failed to access the file. It may have been moved or deleted.' });
      setShowErrorModal(true);
      clearPendingState();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDifferentFile = async () => {
    if (!pendingSession || !pendingSessionId) {
      setShowPermissionModal(false);
      return;
    }

    setShowPermissionModal(false);
    setIsLoading(true);

    try {
      const { file, fileHandle } = await promptForVolumeFile();

      if (await tryLoadSession(file, pendingSession, pendingSessionId, fileHandle)) {
        clearPendingState();
      }
    } catch (err) {
      if ((err as Error).message !== 'File selection cancelled') {
        setError({ type: 'file-not-found', message: 'Failed to select file' });
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
    setIsImportFlow(false);
  };

  const handleForceLoad = async () => {
    if (!pendingFile || !pendingSession) return;

    setShowErrorModal(false);
    setIsLoading(true);

    try {
      if (await tryLoadSession(pendingFile, pendingSession, pendingSessionId, pendingFileHandle ?? undefined, true)) {
        if (!pendingSessionId) {
          setIsImportFlow(false);
        }
      }
    } finally {
      setIsLoading(false);
      clearPendingState();
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

    if (isImportFlow && pendingSession) {
      // JSON import flow - continue to load the imported session
      await performLoadFromJSON(pendingSession);
    } else {
      // Normal flow - show session picker
      await refreshSessionList();
      setShowPickerModal(true);
    }
  };

  /**
   * Handle "Cancel" in unsaved modal.
   */
  const handleCancelUnsaved = () => {
    setShowUnsavedModal(false);
    // Clear pending state in case of JSON import flow
    if (isImportFlow) {
      clearPendingState();
    }
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
    loadFromJSON,
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
