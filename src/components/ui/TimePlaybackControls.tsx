/**
 * Time Playback Controls Component
 *
 * Play/pause, loop, reset, and speed controls for 4D volume playback.
 * Only displayed for volumes with multiple time steps (t > 1).
 */

import { Button, Slider, Label } from '@heroui/react';
import { useViewerStore } from '../../store/viewerStore';
import { useState, useEffect, useRef } from 'react';

export function TimePlaybackControls() {
  const volume = useViewerStore((state) => state.volume);
  const timeStep = useViewerStore((state) => state.timeStep);
  const setTimeStep = useViewerStore((state) => state.setTimeStep);
  const isLoadingTimeStep = useViewerStore((state) => state.isLoadingTimeStep);

  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(5); // Frames per second
  const [loop, setLoop] = useState(true);
  const intervalRef = useRef<number | null>(null);

  const is4D = volume?.dimensions.t && volume.dimensions.t > 1;
  const totalTimeSteps = volume?.dimensions.t || 0;

  // Playback logic
  useEffect(() => {
    if (!is4D || !isPlaying) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const intervalMs = 1000 / fps;

    intervalRef.current = window.setInterval(() => {
      const currentStep = timeStep;
      const nextStep = currentStep + 1;

      if (nextStep >= totalTimeSteps) {
        if (loop) {
          setTimeStep(0); // Loop back to start
        } else {
          setIsPlaying(false); // Stop at end
        }
      } else {
        setTimeStep(nextStep);
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, fps, loop, totalTimeSteps, timeStep, setTimeStep, is4D]);

  // Stop playback if loading takes too long (safety)
  useEffect(() => {
    if (isLoadingTimeStep && isPlaying) {
      // If still loading after 500ms, pause playback
      const timeout = setTimeout(() => {
        if (isLoadingTimeStep) {
          setIsPlaying(false);
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isLoadingTimeStep, isPlaying]);

  // Only show for 4D volumes
  if (!is4D) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {/* Play/Pause Button */}
        <Button
          size="sm"
          onPress={() => setIsPlaying(!isPlaying)}
          isDisabled={isLoadingTimeStep}
          className="bg-white/15 hover:bg-white/25 text-white text-xs px-3 py-1 rounded-md min-w-[60px]"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </Button>

        {/* Loop Toggle */}
        <Button
          size="sm"
          onPress={() => setLoop(!loop)}
          className={`text-xs px-3 py-1 rounded-md ${
            loop ? 'bg-blue-500/30 hover:bg-blue-500/40' : 'bg-white/10 hover:bg-white/15'
          } text-white`}
        >
          Loop: {loop ? 'On' : 'Off'}
        </Button>

        {/* Reset to start */}
        <Button
          size="sm"
          onPress={() => {
            setTimeStep(0);
            setIsPlaying(false);
          }}
          isDisabled={isLoadingTimeStep || timeStep === 0}
          className="bg-white/10 hover:bg-white/15 text-white text-xs px-3 py-1 rounded-md"
        >
          Reset
        </Button>
      </div>

      {/* Speed Control */}
      <Slider
        value={fps}
        onChange={(value) => setFps(value as number)}
        minValue={1}
        maxValue={30}
        step={1}
        className="w-full"
      >
        <Label className="text-white/50 text-xs font-medium">Speed (FPS)</Label>
        <Slider.Output className="text-xs" />
        <Slider.Track className="bg-white/15 backdrop-blur-sm rounded-md">
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
    </div>
  );
}
