/**
 * Session Manager Component
 *
 * Orchestrates all session-related functionality:
 * - File menu with all actions
 * - All session modals
 * - Hook integration
 */

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { UnsavedChangesModal } from './UnsavedChangesModal';
import { SessionActionsContext } from '../../context/SessionActionsContext';
import { SessionPickerModal } from './SessionPickerModal';
import { SaveSessionModal } from './SaveSessionModal';
import { SessionErrorModal } from './SessionErrorModal';
import { PermissionRequestModal } from './PermissionRequestModal';
import { useNewVolume } from '../../hooks/useNewVolume';
import { useSaveSession } from '../../hooks/useSaveSession';
import { useLoadSession } from '../../hooks/useLoadSession';
import { useViewerStore } from '../../store/viewerStore';
import { exportSessionToJSON } from '../../utils/sessionStorage';
import { importSessionFromJSON } from '../../utils/sessionStorage';
import { serializeViewerState, getCurrentVersion } from '../../utils/stateSerializer';
import type { SessionError } from '../../types/session';

export function SessionManager({ children }: { children?: ReactNode }) {
  const volumeFileMetadata = useViewerStore((state) => state.volumeFileMetadata);

  // Modal state from store (shared with drag-and-drop)
  const showNewVolumeUnsavedModal = useViewerStore((state) => state.showNewVolumeUnsavedModal);
  const pendingNewVolumeFile = useViewerStore((state) => state.pendingNewVolumeFile);
  const pendingNewVolumeFileHandle = useViewerStore((state) => state.pendingNewVolumeFileHandle);
  const setShowNewVolumeUnsavedModal = useViewerStore((state) => state.setShowNewVolumeUnsavedModal);
  const setPendingNewVolumeFile = useViewerStore((state) => state.setPendingNewVolumeFile);

  const [exportError, setExportError] = useState<SessionError | null>(null);

  // Hooks
  const newVolume = useNewVolume();
  const saveSession = useSaveSession();
  const loadSession = useLoadSession();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Cmd on Mac, Ctrl on Windows/Linux
      const modifierKey = e.metaKey || e.ctrlKey;
      if (!modifierKey) return;

      // Cmd+N - New Volume
      if (e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        newVolume.triggerFilePicker();
        return;
      }

      // Cmd+S - Save Session (quick save)
      if (e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        saveSession.quickSave();
        return;
      }

      // Shift+Cmd+S - Save Session As
      if (e.key === 's' && e.shiftKey) {
        e.preventDefault();
        saveSession.saveAs();
        return;
      }

      // Cmd+O - Load Session
      if (e.key === 'o' && !e.shiftKey) {
        e.preventDefault();
        loadSession.openSessionPicker();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [newVolume, saveSession, loadSession]);

  /**
   * Handle New Volume from File Menu.
   */
  const handleNewVolume = () => {
    newVolume.triggerFilePicker();
  };

  /**
   * Handle Save Session (quick save).
   */
  const handleSaveSession = async () => {
    await saveSession.quickSave();
  };

  /**
   * Handle Save Session As (always prompt for name).
   */
  const handleSaveSessionAs = () => {
    saveSession.saveAs();
  };

  /**
   * Handle Load Session (open picker).
   */
  const handleLoadSession = () => {
    loadSession.openSessionPicker();
  };

  /**
   * Handle Export Session (download JSON).
   */
  const handleExportSession = () => {
    if (!volumeFileMetadata) {
      console.error('Cannot export session: Missing volume metadata');
      return;
    }

    try {
      const viewerState = serializeViewerState(useViewerStore.getState());

      // Use stored metadata for export
      const volumeReference = {
        fileName: volumeFileMetadata.fileName,
        fileSize: volumeFileMetadata.fileSize,
        lastModified: volumeFileMetadata.lastModified,
        fileHash: volumeFileMetadata.fileHash,
      };

      const session = {
        version: getCurrentVersion(),
        timestamp: Date.now(),
        volumeReference,
        viewerState,
      };

      const fileName = `session-${volumeFileMetadata.fileName.replace(/\.(nii|nii\.gz)$/i, '')}-${Date.now()}`;
      exportSessionToJSON(session, fileName);
    } catch (error) {
      setExportError({
        type: 'serialization-error',
        message: 'Failed to export session. Please try again.',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  };

  /**
   * Handle Import Session (upload JSON).
   */
  const handleImportSession = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.flux,.json';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const session = await importSessionFromJSON(file);
        await loadSession.loadFromJSON(session);
      } catch (error) {
        console.error('Failed to import session:', error);
      }
    };

    input.click();
  };

  /**
   * Handle "Save" from unsaved changes modal (New Volume flow).
   * Uses store state (shared with drag-and-drop).
   */
  const handleSaveFromUnsavedModal = async () => {
    await handleSaveSession();
    setShowNewVolumeUnsavedModal(false);

    if (pendingNewVolumeFile) {
      await newVolume.loadVolumeFile(pendingNewVolumeFile, pendingNewVolumeFileHandle ?? undefined);
      setPendingNewVolumeFile(null);
    }
  };

  /**
   * Handle "Don't Save" from unsaved changes modal (New Volume flow).
   */
  const handleDontSaveFromUnsavedModal = () => {
    setShowNewVolumeUnsavedModal(false);

    if (pendingNewVolumeFile) {
      newVolume.loadVolumeFile(pendingNewVolumeFile, pendingNewVolumeFileHandle ?? undefined);
      setPendingNewVolumeFile(null);
    }
  };

  /**
   * Handle "Cancel" from unsaved changes modal (New Volume flow).
   */
  const handleCancelFromUnsavedModal = () => {
    setShowNewVolumeUnsavedModal(false);
    setPendingNewVolumeFile(null);
  };

  /**
   * Handle "Save" from unsaved changes modal (Load Session flow).
   */
  const handleSaveFromLoadUnsavedModal = async () => {
    await handleSaveSession();
    loadSession.handleDontSave();
  };

  const actions = {
    onNewVolume: handleNewVolume,
    onSaveSession: handleSaveSession,
    onSaveSessionAs: handleSaveSessionAs,
    onLoadSession: handleLoadSession,
    onExportSession: handleExportSession,
    onImportSession: handleImportSession,
  };

  return (
    <SessionActionsContext.Provider value={actions}>
      {children}

      {/* Unsaved Changes Modal (New Volume - shared with drag-and-drop) */}
      <UnsavedChangesModal
        isOpen={showNewVolumeUnsavedModal}
        onSave={handleSaveFromUnsavedModal}
        onDontSave={handleDontSaveFromUnsavedModal}
        onCancel={handleCancelFromUnsavedModal}
      />

      {/* Save Session Modal */}
      <SaveSessionModal
        isOpen={saveSession.showSaveModal}
        volumeFileName={volumeFileMetadata?.fileName || null}
        onSave={saveSession.handleSaveFromModal}
        onCancel={saveSession.handleCancelSave}
      />

      {/* Session Picker Modal */}
      <SessionPickerModal
        isOpen={loadSession.showPickerModal}
        sessions={loadSession.sessions}
        onLoad={loadSession.handleLoadSession}
        onDelete={loadSession.handleDeleteSession}
        onClose={() => loadSession.setShowPickerModal(false)}
      />

      {/* Unsaved Changes Modal (Load Session) */}
      <UnsavedChangesModal
        isOpen={loadSession.showUnsavedModal}
        onSave={handleSaveFromLoadUnsavedModal}
        onDontSave={loadSession.handleDontSave}
        onCancel={loadSession.handleCancelUnsaved}
      />

      {/* Session Error Modal */}
      <SessionErrorModal
        isOpen={loadSession.showErrorModal}
        error={loadSession.error}
        validationResult={loadSession.validationResult || undefined}
        onClose={loadSession.closeErrorModal}
        onForceLoad={loadSession.handleForceLoad}
      />

      {/* Export Error Modal */}
      <SessionErrorModal
        isOpen={exportError !== null}
        error={exportError}
        onClose={() => setExportError(null)}
      />

      {/* Permission Request Modal */}
      <PermissionRequestModal
        isOpen={loadSession.showPermissionModal}
        fileName={loadSession.pendingFileName}
        onGrantPermission={loadSession.handleGrantPermission}
        onSelectDifferentFile={loadSession.handleSelectDifferentFile}
        onCancel={loadSession.closePermissionModal}
      />
    </SessionActionsContext.Provider>
  );
}
