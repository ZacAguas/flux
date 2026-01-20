import { extend, type ThreeToJSXElements } from '@react-three/fiber';
import * as THREE from 'three/webgpu';
import { useEffect } from 'react';
import './App.css';
import { FileImport } from './components/FileImport';
import { PersistentLayout } from './components/layouts/PersistentLayout';
import { LayoutContextProvider } from './context/LayoutContext';
import { ControlPanel } from './components/ui/ControlPanel';
import { AutoSaveRestoreModal } from './components/ui/AutoSaveRestoreModal';
import { PermissionRequestModal } from './components/ui/PermissionRequestModal';
import { SessionErrorModal } from './components/ui/SessionErrorModal';
import { useViewerStore } from './store/viewerStore';
import { useStateChangeTracking } from './hooks/useStateChangeTracking';
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

  // Initialize IndexedDB on mount
  useEffect(() => {
    initializeSessionDB().catch(err => {
      console.error('Failed to initialize session database:', err);
    });
  }, []);

  // Enable state tracking, auto-save, and global drop handler when volume is loaded
  useStateChangeTracking();
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
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          maxWidth: '500px',
          width: '90%'
        }}>
          <FileImport />
        </div>
      )}

      {/* Auto-Save Restore Modal */}
      <AutoSaveRestoreModal
        isOpen={autoSaveRestore.showRestoreModal}
        timestamp={autoSaveRestore.autoSaveTimestamp}
        volumeFileName={autoSaveRestore.autoSaveFileName}
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
    </>
  );
}

export default App;
