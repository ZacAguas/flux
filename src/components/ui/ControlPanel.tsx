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
import { useViewerStore } from '../../store/viewerStore';
import { useState } from 'react';

export function ControlPanel() {
  const controlPanelOpen = useViewerStore((state) => state.controlPanelOpen);
  const setControlPanelOpen = useViewerStore((state) => state.setControlPanelOpen);
  const controlPanelPinned = useViewerStore((state) => state.controlPanelPinned);
  const setControlPanelPinned = useViewerStore((state) => state.setControlPanelPinned);
  const [isHoveringButton, setIsHoveringButton] = useState(false);

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
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-stretch gap-6 px-4 py-3 max-w-full overflow-x-auto">
          {/* Layout Mode Selection */}
          <div className="flex flex-col gap-2 min-w-fit">
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">
              Layout
            </span>
            <LayoutModeButtons />
          </div>

          {/* Vertical Divider */}
          <div className="w-px bg-white/10" />

          {/* Slice Controls */}
          <div className="flex flex-col gap-2 min-w-[180px]">
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">
              Slices
            </span>
            <SliceControls />
          </div>

          {/* Vertical Divider */}
          <div className="w-px bg-white/10" />

          {/* Window/Level Controls */}
          <div className="flex flex-col gap-2 min-w-[180px]">
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">
              Window/Level
            </span>
            <WindowLevelControls />
          </div>

          {/* Vertical Divider */}
          <div className="w-px bg-white/10" />

          {/* View Options */}
          <div className="flex flex-col gap-2 min-w-fit">
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">
              Options
            </span>
            <ViewOptionsControls />
          </div>
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
