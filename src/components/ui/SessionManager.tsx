/**
 * Session Manager Component
 *
 * Orchestrates all session-related functionality:
 * - File menu with all actions
 * - All session modals
 * - Hook integration
 */

import { FileMenu } from './FileMenu';
import { UnsavedChangesModal } from './UnsavedChangesModal';
import { SessionPickerModal } from './SessionPickerModal';
import { SaveSessionModal } from './SaveSessionModal';
import { SessionErrorModal } from './SessionErrorModal';
import { useNewVolume } from '../../hooks/useNewVolume';
import { useSaveSession } from '../../hooks/useSaveSession';
import { useLoadSession } from '../../hooks/useLoadSession';
import { useViewerStore } from '../../store/viewerStore';
import { exportSessionToJSON } from '../../utils/sessionStorage';
import { importSessionFromJSON } from '../../utils/sessionStorage';
import { serializeViewerState, getCurrentVersion } from '../../utils/stateSerializer';

export function SessionManager() {
  const volumeFileMetadata = useViewerStore((state) => state.volumeFileMetadata);

  // Hooks
  const newVolume = useNewVolume();
  const saveSession = useSaveSession();
  const loadSession = useLoadSession();

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
      console.error('Failed to export session:', error);
    }
  };

  /**
   * Handle Import Session (upload JSON).
   */
  const handleImportSession = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const session = await importSessionFromJSON(file);
        // TODO: Load the imported session
        console.log('Session imported:', session);
      } catch (error) {
        console.error('Failed to import session:', error);
      }
    };

    input.click();
  };

  /**
   * Handle "Save" from unsaved changes modal (New Volume flow).
   */
  const handleSaveFromUnsavedModal = async () => {
    await handleSaveSession();
    const pendingFile = newVolume.handleSave();
    if (pendingFile) {
      await newVolume.loadVolumeFile(pendingFile);
    }
  };

  /**
   * Handle "Save" from unsaved changes modal (Load Session flow).
   */
  const handleSaveFromLoadUnsavedModal = async () => {
    await handleSaveSession();
    loadSession.handleDontSave();
  };

  return (
    <>
      {/* File Menu */}
      <FileMenu
        onNewVolume={handleNewVolume}
        onSaveSession={handleSaveSession}
        onSaveSessionAs={handleSaveSessionAs}
        onLoadSession={handleLoadSession}
        onExportSession={handleExportSession}
        onImportSession={handleImportSession}
      />

      {/* Unsaved Changes Modal (New Volume) */}
      <UnsavedChangesModal
        isOpen={newVolume.showUnsavedModal}
        onSave={handleSaveFromUnsavedModal}
        onDontSave={newVolume.handleDontSave}
        onCancel={newVolume.handleCancel}
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
    </>
  );
}
