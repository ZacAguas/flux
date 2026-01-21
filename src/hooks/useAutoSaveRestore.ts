/**
 * useAutoSaveRestore Hook
 *
 * Handles auto-save restoration flow on app startup.
 * Checks for existing auto-save, shows restore modal, and handles
 * file resolution including permission requests and file picker fallback.
 */

import { useState, useEffect } from 'react';
import { useViewerStore } from '../store/viewerStore';
import { checkAutoSaveOnMount, dismissAutoSave } from './useAutoSave';
import {
  resolveSessionFile,
  requestSessionFileAccess,
  promptSessionFile,
  loadSessionWithFile,
} from '../utils/sessionLoader';
import { getAutoSaveMetadata } from '../utils/sessionStorage';
import type { ViewerSession, SessionError, VolumeValidationResult } from '../types/session';

export function useAutoSaveRestore() {
  const markClean = useViewerStore((state) => state.markClean);

  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [autoSaveSession, setAutoSaveSession] = useState<ViewerSession | null>(null);
  const [autoSaveThumbnail, setAutoSaveThumbnail] = useState<string | null>(null);
  const [pendingFileHandle, setPendingFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [error, setError] = useState<SessionError | null>(null);
  const [validationResult, setValidationResult] = useState<VolumeValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Check for auto-save on mount.
   */
  useEffect(() => {
    const checkForAutoSave = async () => {
      const session = await checkAutoSaveOnMount();
      if (session) {
        setAutoSaveSession(session);
        setShowRestoreModal(true);

        // Fetch metadata for thumbnail
        const metadata = await getAutoSaveMetadata();
        if (metadata?.thumbnail) {
          setAutoSaveThumbnail(metadata.thumbnail);
        }
      }
    };

    checkForAutoSave();
  }, []);

  const tryLoadSession = async (
    file: File,
    session: ViewerSession,
    fileHandle?: FileSystemFileHandle,
    skipValidation = false,
  ): Promise<boolean> => {
    const result = await loadSessionWithFile(file, session, fileHandle, skipValidation);

    if (result.status === 'validation-failed') {
      setPendingFile(result.file);
      setPendingFileHandle(result.fileHandle ?? null);
      setValidationResult(result.validation);
      setError({ type: 'file-mismatch', message: 'Volume file does not match auto-save' });
      setShowErrorModal(true);
      return false;
    }

    if (result.status === 'error') {
      console.error('Failed to load session:', result.error);
      return false;
    }

    markClean();
    await dismissAutoSave();
    return true;
  };

  const handleRestore = async () => {
    if (!autoSaveSession) return;

    setShowRestoreModal(false);
    setIsLoading(true);

    try {
      const resolveResult = await resolveSessionFile(autoSaveSession);

      if (resolveResult.status === 'resolved') {
        await tryLoadSession(resolveResult.file, autoSaveSession, resolveResult.fileHandle);
      } else if (resolveResult.status === 'needs-permission') {
        setPendingFileHandle(resolveResult.fileHandle);
        setShowPermissionModal(true);
      } else {
        await handleSelectFile();
      }
    } catch (err) {
      console.error('Failed to restore auto-save:', err);
      await dismissAutoSave();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle dismiss button click.
   * Clears auto-save and closes modal.
   */
  const handleDismiss = async () => {
    setShowRestoreModal(false);
    await dismissAutoSave();
    setAutoSaveSession(null);
    setAutoSaveThumbnail(null);
  };

  /**
   * Handle permission grant button click.
   * MUST be called from user gesture (button click).
   */
  const handleGrantPermission = async () => {
    if (!pendingFileHandle || !autoSaveSession) {
      setShowPermissionModal(false);
      return;
    }

    setShowPermissionModal(false);
    setIsLoading(true);

    try {
      const result = await requestSessionFileAccess(pendingFileHandle);

      if (result.file) {
        if (await tryLoadSession(result.file, autoSaveSession, pendingFileHandle)) {
          clearPendingState();
        }
      } else if (result.denied) {
        console.warn('Permission denied, prompting for file');
        await handleSelectFile();
      } else {
        setShowRestoreModal(true);
      }
    } catch (err) {
      console.error('Failed to access file:', err);
      await handleSelectFile();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle select different file button click.
   * Opens file picker as fallback.
   */
  const handleSelectDifferentFile = async () => {
    setShowPermissionModal(false);
    await handleSelectFile();
  };

  const handleSelectFile = async () => {
    if (!autoSaveSession) return;

    setIsLoading(true);

    try {
      const pickerResult = await promptSessionFile();

      if (!pickerResult) {
        setShowRestoreModal(true);
        return;
      }

      if (await tryLoadSession(pickerResult.file, autoSaveSession, pickerResult.fileHandle)) {
        clearPendingState();
      }
    } catch (err) {
      console.error('Failed to select file:', err);
      await dismissAutoSave();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPermission = () => {
    setShowPermissionModal(false);
    setShowRestoreModal(true);
  };

  const handleForceLoad = async () => {
    if (!pendingFile || !autoSaveSession) return;

    setShowErrorModal(false);
    setIsLoading(true);

    try {
      if (await tryLoadSession(pendingFile, autoSaveSession, pendingFileHandle ?? undefined, true)) {
        clearPendingState();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setValidationResult(null);
    setShowRestoreModal(true);
    setPendingFile(null);
    setPendingFileHandle(null);
  };

  const clearPendingState = () => {
    setPendingFileHandle(null);
    setPendingFile(null);
    setAutoSaveSession(null);
    setAutoSaveThumbnail(null);
    setValidationResult(null);
  };

  return {
    showRestoreModal,
    showPermissionModal,
    showErrorModal,
    autoSaveTimestamp: autoSaveSession?.timestamp ?? null,
    autoSaveFileName: autoSaveSession?.volumeReference.fileName ?? null,
    autoSaveThumbnail,
    error,
    validationResult,
    isLoading,
    handleRestore,
    handleDismiss,
    handleGrantPermission,
    handleSelectDifferentFile,
    handleCancelPermission,
    handleForceLoad,
    closeErrorModal,
  };
}
