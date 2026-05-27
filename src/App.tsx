import { extend, type ThreeToJSXElements } from '@react-three/fiber';
import * as THREE from 'three/webgpu';
import { useEffect, useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Chip } from '@heroui/react';
import { AnimatePresence, motion } from 'motion/react';
import './App.css';
import { SplashScreen } from './components/SplashScreen';
import { PersistentLayout } from './components/layouts/PersistentLayout';
import { LayoutContextProvider } from './context/LayoutContext';
import { SessionManager } from './components/ui/SessionManager';
import { IconRail } from './components/ui/IconRail';
import { SidePanel } from './components/ui/SidePanel';
import { MobileBar } from './components/ui/MobileBar';
import { MobileSheet } from './components/ui/MobileSheet';
import { RadialMenu } from './components/ui/RadialMenu';
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
import { useBreakpoint, PANEL_WIDTH, springWidth } from './utils/uiLayout';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

declare module '@react-three/fiber' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> { }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
extend(THREE as any);


function ViewerLayout() {
  const bp = useBreakpoint();
  const activeSections = useViewerStore((state) => state.activeSections);
  const isSidePanelOpen = activeSections.length > 0;

  const [radialMenu, setRadialMenu] = useState<{ x: number; y: number } | null>(null);

  // Open radial menu on right-button mouseup (not contextmenu) so that
  // right-click-drag panning in the 3D view never triggers it.
  useEffect(() => {
    const DRAG_THRESHOLD = 4;
    let startX = 0;
    let startY = 0;
    let wasDrag = false;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 2) return;
      startX = e.clientX;
      startY = e.clientY;
      wasDrag = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!(e.buttons & 2)) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) wasDrag = true;
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button !== 2) return;
      if (wasDrag) { wasDrag = false; return; }
      setRadialMenu({ x: e.clientX, y: e.clientY });
    };

    // Always suppress the browser's native context menu.
    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('contextmenu', onContextMenu);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('contextmenu', onContextMenu);
    };
  }, []);

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
          <div className="relative flex-1 min-w-0">
            <SidePanel />
            <motion.div
              className="absolute inset-0"
              animate={{ left: isSidePanelOpen ? PANEL_WIDTH : 0 }}
              transition={springWidth}
            >
              <PersistentLayout />
            </motion.div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {radialMenu && (
          <RadialMenu
            key="radial-menu"
            x={radialMenu.x}
            y={radialMenu.y}
            onClose={() => setRadialMenu(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function App() {
  const volume = useViewerStore((state) => state.volume);
  const volumeFileMetadata = useViewerStore((state) => state.volumeFileMetadata);
  const currentSessionName = useViewerStore((state) => state.currentSessionName);
  const helpModalOpen = useViewerStore((state) => state.helpModalOpen);
  const setHelpModalOpen = useViewerStore((state) => state.setHelpModalOpen);
  const theme = useViewerStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

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

      <AnimatePresence mode="wait">
        {volume ? (
          <motion.div
            key="viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="contents"
          >
            <LayoutContextProvider>
              <SessionManager>
                <ViewerLayout />
              </SessionManager>
            </LayoutContextProvider>
          </motion.div>
        ) : (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="contents"
          >
            <SplashScreen />
          </motion.div>
        )}
      </AnimatePresence>

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

      <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />

      {/* Drag-over file indicator */}
      <AnimatePresence>
        {isDraggingFile && (
          <motion.div
            key="drag-overlay"
            className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(6px)', backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)', backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0)' }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <Chip
                size="lg"
                variant="primary"
                className="bg-[rgba(19,221,209,0.15)] border border-[rgba(19,221,209,0.4)] text-[#13ddd1]"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Drop to open
              </Chip>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
