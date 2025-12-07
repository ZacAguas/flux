/**
 * Control Panel Component
 *
 * Top bar containing all viewer controls organized into sections:
 * - Layout mode selection
 * - Slice position controls
 * - Window/Level controls
 * - View options
 *
 * Positioned at the top of the viewport with semi-transparent background.
 */

import { LayoutModeButtons } from './LayoutModeButtons';
import { SliceControls } from './SliceControls';
import { WindowLevelControls } from './WindowLevelControls';
import { ViewOptionsControls } from './ViewOptionsControls';

export function ControlPanel() {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
      <div className="flex items-start gap-6 px-4 py-3 max-w-full overflow-x-auto">
        {/* Layout Mode Selection */}
        <div className="flex flex-col gap-2 min-w-fit">
          <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">
            Layout
          </span>
          <LayoutModeButtons />
        </div>

        {/* Vertical Divider */}
        <div className="h-full w-px bg-white/10 self-stretch" />

        {/* Slice Controls */}
        <div className="flex flex-col gap-2 min-w-[180px]">
          <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">
            Slices
          </span>
          <SliceControls />
        </div>

        {/* Vertical Divider */}
        <div className="h-full w-px bg-white/10 self-stretch" />

        {/* Window/Level Controls */}
        <div className="flex flex-col gap-2 min-w-[180px]">
          <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">
            Window/Level
          </span>
          <WindowLevelControls />
        </div>

        {/* Vertical Divider */}
        <div className="h-full w-px bg-white/10 self-stretch" />

        {/* View Options */}
        <div className="flex flex-col gap-2 min-w-fit">
          <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">
            Options
          </span>
          <ViewOptionsControls />
        </div>
      </div>
    </div>
  );
}
