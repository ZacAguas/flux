import { extend, type ThreeToJSXElements } from '@react-three/fiber';
import * as THREE from 'three/webgpu';
import { useEffect } from 'react';
import './App.css';
import { SplashScreen } from './components/SplashScreen';
import { PersistentLayout } from './components/layouts/PersistentLayout';
import { LayoutContextProvider } from './context/LayoutContext';
import { ControlPanel } from './components/ui/ControlPanel';
import { AutoSaveRestoreModal } from './components/ui/AutoSaveRestoreModal';
import { PermissionRequestModal } from './components/ui/PermissionRequestModal';
import { SessionErrorModal } from './components/ui/SessionErrorModal';
import { HelpModal } from './components/ui/HelpModal';
import { useViewerStore } from './store/viewerStore';
import { useStateChangeTracking } from './hooks/useStateChangeTracking';
import { useBeforeUnload } from './hooks/useBeforeUnload';
import { useGlobalDropHandler } from './hooks/useGlobalDropHandler';
import { useAutoSave } from './hooks/useAutoSave';
import { useAutoSaveRestore } from './hooks/useAutoSaveRestore';
import { initializeSessionDB } from './utils/sessionStorage';

declare module '@react-three/fiber' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> { }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
extend(THREE as any);


function App() {
  const volume = useViewerStore((state) => state.volume);
  const volumeFileMetadata = useViewerStore((state) => state.volumeFileMetadata);
  const currentSessionName = useViewerStore((state) => state.currentSessionName);
  const helpModalOpen = useViewerStore((state) => state.helpModalOpen);
  const setHelpModalOpen = useViewerStore((state) => state.setHelpModalOpen);

  // Sync document title: prefer session name, fall back to filename
  useEffect(() => {
    const label = currentSessionName
      ?? volumeFileMetadata?.fileName?.replace(/\.nii(\.gz)?$/i, '');
    document.title = label ? `${label} — Flux` : 'Flux';
  }, [currentSessionName, volumeFileMetadata]);

  // Initialize IndexedDB on mount
  useEffect(() => {
    initializeSessionDB().catch(err => {
      console.error('Failed to initialize session database:', err);
    });
  }, []);

  // Enable state tracking, auto-save, and global drop handler when volume is loaded
  useStateChangeTracking();
  useBeforeUnload();
  useGlobalDropHandler();
  useAutoSave();

  // Auto-save restore flow
  const autoSaveRestore = useAutoSaveRestore();

  return (
    <>
      {volume ? (
        <>
          <LayoutContextProvider>
            <PersistentLayout />
          </LayoutContextProvider>
          <ControlPanel />
        </>
      ) : (
        <SplashScreen />
      )}

      {/* Auto-Save Restore Modal */}
      <AutoSaveRestoreModal
        isOpen={autoSaveRestore.showRestoreModal}
        timestamp={autoSaveRestore.autoSaveTimestamp}
        volumeFileName={autoSaveRestore.autoSaveFileName}
        thumbnail={autoSaveRestore.autoSaveThumbnail}
        onRestore={autoSaveRestore.handleRestore}
        onDismiss={autoSaveRestore.handleDismiss}
      />

      {/* Permission Request Modal (for auto-save restore) */}
      <PermissionRequestModal
        isOpen={autoSaveRestore.showPermissionModal}
        fileName={autoSaveRestore.autoSaveFileName}
        onGrantPermission={autoSaveRestore.handleGrantPermission}
        onSelectDifferentFile={autoSaveRestore.handleSelectDifferentFile}
        onCancel={autoSaveRestore.handleCancelPermission}
      />

      {/* Session Error Modal (for auto-save restore) */}
      <SessionErrorModal
        isOpen={autoSaveRestore.showErrorModal}
        error={autoSaveRestore.error}
        validationResult={autoSaveRestore.validationResult ?? undefined}
        onClose={autoSaveRestore.closeErrorModal}
        onForceLoad={autoSaveRestore.handleForceLoad}
      />

      {/* Help Modal */}
      <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
    </>
  );
}

export default App;
