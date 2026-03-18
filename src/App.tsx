import { extend, type ThreeToJSXElements } from '@react-three/fiber';
import * as THREE from 'three/webgpu';
import { useEffect } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Chip } from '@heroui/react';
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
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

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
  const { isDraggingFile } = useGlobalDropHandler();
  useAutoSave();

  // Auto-save restore flow
  const autoSaveRestore = useAutoSaveRestore();

  return (
    <>
      {/* Vercel */}
      <Analytics />
      <SpeedInsights />

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

      {/* Global drag-over indicator */}
      <div
        className={`fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center transition-all duration-300 ${isDraggingFile ? 'bg-black/40 backdrop-blur-sm opacity-100' : 'opacity-0'
          }`}
      >
        <Chip
          size="lg"
          variant="primary"
          className="bg-[rgba(19,221,209,0.15)] border border-[rgba(19,221,209,0.4)] text-[#13ddd1]"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Drop to open
        </Chip>
      </div>
    </>
  );
}

export default App;
