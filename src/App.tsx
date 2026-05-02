import { extend, type ThreeToJSXElements } from '@react-three/fiber';
import * as THREE from 'three/webgpu';
import { useEffect } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Chip } from '@heroui/react';
import './App.css';
import { SplashScreen } from './components/SplashScreen';
import { PersistentLayout } from './components/layouts/PersistentLayout';
import { LayoutContextProvider } from './context/LayoutContext';
import { SessionManager } from './components/ui/SessionManager';
import { IconRail } from './components/ui/IconRail';
import { SidePanel } from './components/ui/SidePanel';
import { MobileBar } from './components/ui/MobileBar';
import { MobileSheet } from './components/ui/MobileSheet';
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
import { useBreakpoint } from './utils/uiLayout';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

declare module '@react-three/fiber' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> { }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
extend(THREE as any);


function ViewerLayout() {
  const helpModalOpen = useViewerStore((state) => state.helpModalOpen);
  const setHelpModalOpen = useViewerStore((state) => state.setHelpModalOpen);
  const bp = useBreakpoint();

  return (
    <>
      {bp === 'mobile' ? (
        <div className="relative w-screen h-screen">
          <div className="absolute inset-0 bottom-[60px]">
            <PersistentLayout />
          </div>
          <MobileSheet />
          <MobileBar />
        </div>
      ) : bp === 'tablet' ? (
        <div className="relative flex w-screen h-screen">
          <IconRail />
          <div className="flex-1 min-w-0">
            <PersistentLayout />
          </div>
          <SidePanel overlayMode />
        </div>
      ) : (
        <div className="flex w-screen h-screen">
          <IconRail />
          <SidePanel />
          <div className="flex-1 min-w-0">
            <PersistentLayout />
          </div>
        </div>
      )}

      <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
    </>
  );
}

function App() {
  const volume = useViewerStore((state) => state.volume);
  const volumeFileMetadata = useViewerStore((state) => state.volumeFileMetadata);
  const currentSessionName = useViewerStore((state) => state.currentSessionName);

  useEffect(() => {
    const label = currentSessionName
      ?? volumeFileMetadata?.fileName?.replace(/\.nii(\.gz)?$/i, '');
    document.title = label ? `${label} — Flux` : 'Flux';
  }, [currentSessionName, volumeFileMetadata]);

  useEffect(() => {
    initializeSessionDB().catch(err => {
      console.error('Failed to initialize session database:', err);
    });
  }, []);

  useStateChangeTracking();
  useBeforeUnload();
  const { isDraggingFile } = useGlobalDropHandler();
  useAutoSave();

  const autoSaveRestore = useAutoSaveRestore();

  return (
    <>
      <Analytics />
      <SpeedInsights />

      {volume ? (
        <LayoutContextProvider>
          <SessionManager>
            <ViewerLayout />
          </SessionManager>
        </LayoutContextProvider>
      ) : (
        <SplashScreen />
      )}

      <AutoSaveRestoreModal
        isOpen={autoSaveRestore.showRestoreModal}
        timestamp={autoSaveRestore.autoSaveTimestamp}
        volumeFileName={autoSaveRestore.autoSaveFileName}
        thumbnail={autoSaveRestore.autoSaveThumbnail}
        onRestore={autoSaveRestore.handleRestore}
        onDismiss={autoSaveRestore.handleDismiss}
      />

      <PermissionRequestModal
        isOpen={autoSaveRestore.showPermissionModal}
        fileName={autoSaveRestore.autoSaveFileName}
        onGrantPermission={autoSaveRestore.handleGrantPermission}
        onSelectDifferentFile={autoSaveRestore.handleSelectDifferentFile}
        onCancel={autoSaveRestore.handleCancelPermission}
      />

      <SessionErrorModal
        isOpen={autoSaveRestore.showErrorModal}
        error={autoSaveRestore.error}
        validationResult={autoSaveRestore.validationResult ?? undefined}
        onClose={autoSaveRestore.closeErrorModal}
        onForceLoad={autoSaveRestore.handleForceLoad}
      />

      <div
        className={`fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center transition-all duration-300 ${
          isDraggingFile ? 'bg-black/40 backdrop-blur-sm opacity-100' : 'opacity-0'
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
