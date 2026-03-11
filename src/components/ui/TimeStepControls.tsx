/**
 * Time Step Controls Component
 *
 * Slider for controlling the current time step in 4D volumes.
 * Only displayed for volumes with multiple time steps (t > 1).
 * Connected to Zustand store for state management.
 */

import { Slider, Label } from '@heroui/react';
import { useViewerStore } from '../../store/viewerStore';

export function TimeStepControls() {
  const volume = useViewerStore((state) => state.volume);
  const timeStep = useViewerStore((state) => state.timeStep);
  const setTimeStep = useViewerStore((state) => state.setTimeStep);
  const isLoadingTimeStep = useViewerStore((state) => state.isLoadingTimeStep);

  const totalTimeSteps = volume!.dimensions.t;

  return (
    <div className="flex flex-col gap-3">
      <Slider
        value={timeStep}
        onChange={(value) => setTimeStep(value as number)}
        minValue={0}
        maxValue={totalTimeSteps - 1}
        step={1}
        className="w-full"
        isDisabled={isLoadingTimeStep}
      >
        <div className="flex items-center gap-2">
          <Label className="text-white/50 text-xs font-medium">Time Step</Label>
          {isLoadingTimeStep && (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white/70 rounded-full animate-spin" />
          )}
        </div>
        <Slider.Output className="text-xs">
          {({ state }) => `${state.getThumbValueLabel(0)} / ${totalTimeSteps - 1}`}
        </Slider.Output>
        <Slider.Track className="bg-white/15 backdrop-blur-sm rounded-md">
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
    </div>
  );
}
