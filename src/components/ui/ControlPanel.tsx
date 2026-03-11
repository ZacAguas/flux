/**
 * Control Panel Component
 *
 * Top bar containing all viewer controls organized into sections.
 * - Slides in/out on hover (when not pinned)
 * - Click toggle button to pin open/closed
 */

import { Button } from '@heroui/react';
import {
  PhotoIcon,
  FilmIcon,
  EyeIcon,
  CubeIcon,
  ScissorsIcon,
  ChartBarSquareIcon,
  CalculatorIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { SessionManager } from './SessionManager';
import { LayoutModeButtons } from './LayoutModeButtons';
import { SliceControls } from './SliceControls';
import { WindowLevelControls } from './WindowLevelControls';
import { TimeStepControls } from './TimeStepControls';
import { TimePlaybackControls } from './TimePlaybackControls';
import { ViewOptionsControls } from './ViewOptionsControls';
import { RenderingControls } from './RenderingControls';
import { ClippingPlaneControls } from './ClippingPlaneControls';
import { TransferFunctionEditor } from './TransferFunctionEditor';
import { MeasurementControls } from './MeasurementControls';
import { CollapsibleSection } from './CollapsibleSection';
import { useViewerStore } from '../../store/viewerStore';
import { useState, useRef, useEffect } from 'react';

export function ControlPanel() {
  const controlPanelOpen = useViewerStore((state) => state.controlPanelOpen);
  const setControlPanelOpen = useViewerStore((state) => state.setControlPanelOpen);
  const controlPanelPinned = useViewerStore((state) => state.controlPanelPinned);
  const setControlPanelPinned = useViewerStore((state) => state.setControlPanelPinned);
  const setControlPanelContentHeight = useViewerStore((state) => state.setControlPanelContentHeight);
  const popoverOpen = useViewerStore((state) => state.popoverOpen);
  const volume = useViewerStore((state) => state.volume);
  const is4D = Boolean(volume?.dimensions.t && volume.dimensions.t > 1);
  const [isMouseOverPanel, setIsMouseOverPanel] = useState(false);
  // Prevents panel from opening due to hover after unpinning (until mouse leaves)
  // Unpinning while hovering should close panel, not keep it open
  const [suppressHoverOpen, setSuppressHoverOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panelRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setControlPanelContentHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(panelRef.current);

    return () => resizeObserver.disconnect();
  }, [setControlPanelContentHeight]);

  // Panel state logic: single source of truth for open/closed
  useEffect(() => {
    if (controlPanelPinned) {
      setControlPanelOpen(true);
    } else if (suppressHoverOpen) {
      setControlPanelOpen(false);
    } else {
      const shouldBeOpen = isMouseOverPanel || popoverOpen;
      setControlPanelOpen(shouldBeOpen);
    }
  }, [isMouseOverPanel, popoverOpen, controlPanelPinned, suppressHoverOpen, setControlPanelOpen]);

  const getButtonIcon = () => {
    if (controlPanelOpen) {
      return controlPanelPinned
        ? <ChevronUpIcon className="w-3.5 h-3.5" />
        : <MapPinIcon className="w-3.5 h-3.5" />;
    }
    return <ChevronDownIcon className="w-3.5 h-3.5" />;
  };

  const handleMouseEnter = () => {
    setIsMouseOverPanel(true);
  };

  const handleMouseLeave = () => {
    setIsMouseOverPanel(false);
    setSuppressHoverOpen(false);
  };

  const handleToggleClick = () => {
    const newPinned = !controlPanelPinned;
    setControlPanelPinned(newPinned);

    // When unpinning, suppress hover open until mouse leaves
    if (!newPinned) {
      setSuppressHoverOpen(true);
    }
  };

  return (
    <div
      className="absolute top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out select-none"
      style={{
        // When closed, slide up but leave the button visible (30px)
        transform: controlPanelOpen ? 'translateY(0)' : 'translateY(calc(-100% + 30px))',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={panelRef}
        className="bg-black/20 backdrop-blur-sm border-b border-white/10"
      >
        <div className="flex items-start gap-4 px-4 py-3 max-w-full overflow-x-auto">
          <div className="flex flex-col gap-2 min-w-fit shrink-0">
            <SessionManager />
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wide px-0.5">
                Layout
              </span>
              <LayoutModeButtons />
            </div>
          </div>

          <div className="self-stretch w-px bg-white/10 shrink-0" />

          <div className="flex items-start gap-5 flex-wrap flex-1 min-w-0">
            <CollapsibleSection
              id="sliceNavigation"
              title="Slice Navigation"
              icon={<PhotoIcon className="w-3.5 h-3.5" />}
            >
              <div className="flex flex-col gap-3">
                <SliceControls />
                <hr className="border-t border-white/10" />
                <WindowLevelControls />
              </div>
            </CollapsibleSection>

            {is4D && (
              <CollapsibleSection
                id="playback"
                title="Playback"
                icon={<FilmIcon className="w-3.5 h-3.5" />}
              >
                <div className="flex flex-col gap-3">
                  <TimeStepControls />
                  <TimePlaybackControls />
                </div>
              </CollapsibleSection>
            )}

            <CollapsibleSection
              id="display"
              title="Display"
              icon={<EyeIcon className="w-3.5 h-3.5" />}
            >
              <ViewOptionsControls />
            </CollapsibleSection>

            <CollapsibleSection
              id="volumeRendering"
              title="Volume Rendering"
              icon={<CubeIcon className="w-3.5 h-3.5" />}
            >
              <RenderingControls />
            </CollapsibleSection>

            <CollapsibleSection
              id="clippingPlanes"
              title="Clipping Planes"
              icon={<ScissorsIcon className="w-3.5 h-3.5" />}
            >
              <ClippingPlaneControls />
            </CollapsibleSection>

            <CollapsibleSection
              id="transferFunction"
              title="Transfer Function"
              icon={<ChartBarSquareIcon className="w-3.5 h-3.5" />}
            >
              <TransferFunctionEditor />
            </CollapsibleSection>

            <CollapsibleSection
              id="measurements"
              title="Measurements"
              icon={<CalculatorIcon className="w-3.5 h-3.5" />}
            >
              <MeasurementControls />
            </CollapsibleSection>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          size="sm"
          variant="secondary"
          onPress={handleToggleClick}
          className="!rounded-t-none !rounded-b-lg !bg-black/20 backdrop-blur-sm !border !border-white/10 !border-t-0 px-4 py-1 shadow-lg text-white/70"
        >
          {getButtonIcon()}
        </Button>
      </div>
    </div>
  );
}
