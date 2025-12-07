/**
 * Window/Level Controls Component
 *
 * Two sliders for controlling window center and width (contrast/brightness).
 * Connected to Zustand store for state management.
 */

import { Slider, Label } from '@heroui/react';
import { useViewerStore } from '../../store/viewerStore';

export function WindowLevelControls() {
  const layoutMode = useViewerStore((state) => state.layoutMode);
  const volume = useViewerStore((state) => state.volume);
  const windowLevel = useViewerStore((state) => state.windowLevel);
  const setWindowLevel = useViewerStore((state) => state.setWindowLevel);

  if (!volume) return null;

  const { min, max } = volume.dataRange;
  const range = max - min;

  return (
    <div className="flex flex-col gap-3">
      {/* Window Center Slider */}
      <Slider
        value={windowLevel.center}
        isDisabled={layoutMode === 'single'}
        onChange={(value) => setWindowLevel({ center: value as number })}
        minValue={min}
        maxValue={max}
        step={range / 1000}
        className="w-full"
      >
        <Label className="text-white/50 text-xs font-medium">W Center</Label>
        <Slider.Output className="text-xs">
          {({ state }) => Math.round(Number(state.getThumbValueLabel(0)))}
        </Slider.Output>
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>

      {/* Window Width Slider */}
      <Slider
        value={windowLevel.width}
        isDisabled={layoutMode === 'single'}
        onChange={(value) => setWindowLevel({ width: value as number })}
        minValue={0}
        maxValue={range}
        step={range / 1000}
        className="w-full"
      >
        <Label className="text-white/50 text-xs font-medium">W Width</Label>
        <Slider.Output className="text-xs">
          {({ state }) => Math.round(Number(state.getThumbValueLabel(0)))}
        </Slider.Output>
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
    </div>
  );
}
