/**
 * View Options Controls Component
 *
 * Toggle controls for view options like crosshairs.
 * Connected to Zustand store for state management.
 */

import { Switch, Label } from '@heroui/react';
import { useViewerStore } from '../../store/viewerStore';

export function ViewOptionsControls() {
  const showCrosshairs = useViewerStore((state) => state.showCrosshairs);
  const setShowCrosshairs = useViewerStore((state) => state.setShowCrosshairs);

  return (
    <div className="flex flex-col gap-3">
      {/* Crosshairs Toggle */}
      <Switch
        isSelected={showCrosshairs}
        onChange={setShowCrosshairs}
      >
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Label className="text-xs font-medium">Crosshairs</Label>
      </Switch>

      {/* TODO: Time step slider for 4D data */}
      {/* Future implementation when 4D temporal support is added */}
    </div>
  );
}
