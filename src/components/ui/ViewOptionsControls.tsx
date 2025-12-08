/**
 * View Options Controls Component
 *
 * Toggle controls for view options like crosshairs.
 * Connected to Zustand store for state management.
 */

import { Switch, Label, Slider } from '@heroui/react';
import { useViewerStore } from '../../store/viewerStore';

export function ViewOptionsControls() {
  const layoutMode = useViewerStore((state) => state.layoutMode);
  const showCrosshairs = useViewerStore((state) => state.showCrosshairs);
  const setShowCrosshairs = useViewerStore((state) => state.setShowCrosshairs);
  const crosshairSettings = useViewerStore((state) => state.crosshairSettings);
  const setCrosshairSettings = useViewerStore((state) => state.setCrosshairSettings);

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

      {/* Crosshair Color Picker */}
      {showCrosshairs && layoutMode !== 'single' && (
        <div className="flex flex-col gap-1">
          <Label className="text-white/50 text-xs font-medium">Crosshair Color</Label>
          <input
            type="color"
            value={crosshairSettings.color}
            onChange={(e) => setCrosshairSettings({ color: e.target.value })}
            className="w-full h-5 rounded-md border-0 cursor-pointer
            [&::-webkit-color-swatch-wrapper]:p-0
            [&::-webkit-color-swatch-wrapper]:rounded-md
            [&::-webkit-color-swatch]:border-0
            [&::-webkit-color-swatch]:rounded-md
            [&::-moz-color-swatch]:border-0
            [&::-moz-color-swatch]:rounded-md"
          />
        </div>
      )}

      {/* Crosshair Opacity Slider */}
      {showCrosshairs && layoutMode !== 'single' && (
        <Slider
          value={crosshairSettings.opacity}
          onChange={(value) => setCrosshairSettings({ opacity: value as number })}
          minValue={0}
          maxValue={1}
          step={0.05}
          className="w-full"
        >
          <Label className="text-white/50 text-xs font-medium">Crosshair Opacity</Label>
          <Slider.Output className="text-xs">
            {({ state }) => Number(state.getThumbValueLabel(0)).toFixed(2)}
          </Slider.Output>
          <Slider.Track className="bg-white/15 backdrop-blur-sm rounded-md">
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
      )}

      {/* TODO: Time step slider for 4D data */}
      {/* Future implementation when 4D temporal support is added */}
    </div>
  );
}
