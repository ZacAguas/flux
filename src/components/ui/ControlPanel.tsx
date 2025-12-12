/**
 * Control Panel Component
 *
 * Top bar containing all viewer controls organized into sections.
 * - Slides in/out on hover (when not pinned)
 * - Click toggle button to pin open/closed
 */

import { Button } from '@heroui/react';
import { LayoutModeButtons } from './LayoutModeButtons';
import { SliceControls } from './SliceControls';
import { WindowLevelControls } from './WindowLevelControls';
import { ViewOptionsControls } from './ViewOptionsControls';
import { RenderingControls } from './RenderingControls';
import { TransferFunctionEditor } from './TransferFunctionEditor';
import { CollapsibleSection } from './CollapsibleSection';
import { useViewerStore } from '../../store/viewerStore';
import { useState, useRef, useEffect } from 'react';

export function ControlPanel() {
  const controlPanelOpen = useViewerStore((state) => state.controlPanelOpen);
  const setControlPanelOpen = useViewerStore((state) => state.setControlPanelOpen);
  const controlPanelPinned = useViewerStore((state) => state.controlPanelPinned);
  const setControlPanelPinned = useViewerStore((state) => state.setControlPanelPinned);
  const setControlPanelContentHeight = useViewerStore((state) => state.setControlPanelContentHeight);
  const [isHoveringButton, setIsHoveringButton] = useState(false);
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

  const getButtonLabel = () => {
    if (controlPanelOpen) {
      if (isHoveringButton) {
        return controlPanelPinned ? '↑' : '📌';
      }
      return controlPanelPinned ? '↑' : '📌';
    }
    return '↓';
  };

  const handleMouseEnter = () => {
    if (!controlPanelPinned) {
      setControlPanelOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!controlPanelPinned) {
      setControlPanelOpen(false);
    }
  };

  const handleToggleClick = () => {
    const newPinnedState = !controlPanelPinned;
    setControlPanelPinned(newPinnedState);
    setControlPanelOpen(newPinnedState);
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
      {/* Main panel content */}
      <div
        ref={panelRef}
        className="bg-black/20 backdrop-blur-sm border-b border-white/10"
      >
        <div className="flex items-start gap-6 px-4 py-3 max-w-full overflow-x-auto flex-wrap">
          {/* Layout Mode Selection - Always visible, not collapsible */}
          <div className="flex flex-col gap-2 min-w-fit">
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">
              Layout
            </span>
            <LayoutModeButtons />
          </div>

          {/* View Settings Section */}
          <CollapsibleSection
            id="viewSettings"
            title="View Settings"
          >
            <div className="flex flex-col gap-3">
              <SliceControls />
              <WindowLevelControls />

              {/* Time slider placeholder */}
              <hr className="border-t border-white/10" />
              <div className="text-[10px] text-white/40 italic">
                Coming soon: 4D time navigation slider
              </div>
            </div>
          </CollapsibleSection>

          {/* View Options Section */}
          <CollapsibleSection
            id="viewOptions"
            title="View Options"
          >
            <div className="flex flex-col gap-3">
              <ViewOptionsControls />

              {/* Additional view options placeholder */}
              <hr className="border-t border-white/10" />
              <div className="text-[10px] text-white/40 italic">
                Coming soon: orientation markers, scale bar
              </div>
            </div>
          </CollapsibleSection>

          {/* 3D Rendering Section */}
          <CollapsibleSection
            id="rendering3D"
            title="3D Rendering"
          >
            <div className="flex flex-col gap-3">
              <RenderingControls />

              {/* Advanced rendering features placeholder */}
              <hr className="border-t border-white/10" />
              <div className="text-[10px] text-white/40 italic">
                Coming soon: lighting controls, clipping planes
              </div>
            </div>
          </CollapsibleSection>

          {/* Transfer Function Section */}
          <CollapsibleSection
            id="transferFunction"
            title="Transfer Function"
          >
            <TransferFunctionEditor />
          </CollapsibleSection>

          {/* Measurements & Tools Section - Placeholder for future */}
          <CollapsibleSection
            id="measurementsTools"
            title="Measurements & Tools"
          >
            <div className="flex flex-col gap-2 text-xs text-white/50">
              <div className="font-medium text-white/60">Coming Soon:</div>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Distance measurements between points</li>
                <li>Angle measurements</li>
                <li>Volume ROI calculations</li>
                <li>Annotations and labels</li>
                <li>Segmentation tools</li>
              </ul>
            </div>
          </CollapsibleSection>

          {/* Presets & Settings Section - Placeholder for future */}
          <CollapsibleSection
            id="presetsSettings"
            title="Presets & Settings"
          >
            <div className="flex flex-col gap-2 text-xs text-white/50">
              <div className="font-medium text-white/60">Coming Soon:</div>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Save/load viewer configurations</li>
                <li>Camera position presets</li>
                <li>Transfer function presets</li>
                <li>Multi-volume comparison</li>
                <li>Export settings</li>
              </ul>
            </div>
          </CollapsibleSection>
        </div>
      </div>

      {/* Toggle button attached to bottom of panel */}
      <div className="flex justify-center">
        <Button
          size="sm"
          variant="secondary"
          onPress={handleToggleClick}
          onHoverChange={(isHovering) => setIsHoveringButton(isHovering)}
          className="!rounded-t-none !rounded-b-lg !bg-black/20 backdrop-blur-sm !border !border-white/10 !border-t-0 px-4 py-1 shadow-lg"
        >
          <span className="text-xs text-white/70">
            {getButtonLabel()}
          </span>
        </Button>
      </div>
    </div>
  );
}
