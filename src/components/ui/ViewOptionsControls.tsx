/**
 * View Options Controls Component
 *
 * Toggle controls for view options like crosshairs.
 * Connected to Zustand store for state management.
 */

import { Switch, Label } from '@heroui/react';
import { useViewerStore } from '../../store/viewerStore';

export function ViewOptionsControls() {
  const layoutMode = useViewerStore((state) => state.layoutMode);
  const showCrosshairs = useViewerStore((state) => state.showCrosshairs);
  const setShowCrosshairs = useViewerStore((state) => state.setShowCrosshairs);

  return (
    <div className="flex flex-col gap-3">
      {/* Crosshairs Toggle */}
      <Switch
        isSelected={showCrosshairs}
        isDisabled={layoutMode === 'single'}
        onChange={setShowCrosshairs}
      >
        {({ isSelected }) => (
          <>
            <Switch.Control
              className={`backdrop-blur-sm rounded-full ${isSelected ? '' : 'bg-white/15'}`}
            >
              <Switch.Thumb />
            </Switch.Control>
            <Label className="text-white/50 text-xs font-medium">Crosshairs</Label>
          </>
        )}
      </Switch>

      {/* TODO: Time step slider for 4D data */}
      {/* Future implementation when 4D temporal support is added */}
    </div>
  );
}
