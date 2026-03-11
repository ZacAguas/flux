/**
 * Time Playback Controls Component
 *
 * Play/pause, loop, reset, and speed controls for 4D volume playback.
 * Only displayed for volumes with multiple time steps (t > 1).
 */

import { Button, Slider, Label } from '@heroui/react';
import { PlayIcon, PauseIcon, ArrowPathIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon as ArrowPathIconSolid } from '@heroicons/react/24/solid';
import { useViewerStore } from '../../store/viewerStore';
import { useState, useEffect, useRef } from 'react';

export function TimePlaybackControls() {
  const timeStep = useViewerStore((state) => state.timeStep);
  const setTimeStep = useViewerStore((state) => state.setTimeStep);
  const isLoadingTimeStep = useViewerStore((state) => state.isLoadingTimeStep);

  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(5);
  const [loop, setLoop] = useState(true);
  const intervalRef = useRef<number | null>(null);

  const totalTimeSteps = volume!.dimensions.t;

  // Playback logic
  useEffect(() => {
    if (!isPlaying) {
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
  }, [isPlaying, fps, loop, totalTimeSteps, timeStep, setTimeStep]);

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
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {/* Play/Pause Button */}
        <Button
          size="sm"
          onPress={() => setIsPlaying(!isPlaying)}
          isDisabled={isLoadingTimeStep}
          title={isPlaying ? 'Pause' : 'Play'}
          className="!bg-white/15 backdrop-blur-sm hover:!bg-white/25 text-white px-2.5 py-1 rounded-md"
        >
          {isPlaying
            ? <PauseIcon className="w-4 h-4" />
            : <PlayIcon className="w-4 h-4" />
          }
        </Button>

        {/* Loop Toggle */}
        <Button
          size="sm"
          onPress={() => setLoop(!loop)}
          title={loop ? 'Loop: On' : 'Loop: Off'}
          className={`px-2.5 py-1 rounded-md transition-all duration-200 ${
            loop
              ? '!bg-white/15 backdrop-blur-sm text-white'
              : '!bg-transparent text-white/50 hover:text-white/70'
          }`}
        >
          {loop
            ? <ArrowPathIconSolid className="w-4 h-4" />
            : <ArrowPathIcon className="w-4 h-4" />
          }
        </Button>

        {/* Reset to start */}
        <Button
          size="sm"
          onPress={() => {
            setTimeStep(0);
            setIsPlaying(false);
          }}
          isDisabled={isLoadingTimeStep || timeStep === 0}
          title="Reset to start"
          className="!bg-white/10 backdrop-blur-sm hover:!bg-white/15 text-white px-2.5 py-1 rounded-md"
        >
          <ArrowUturnLeftIcon className="w-4 h-4" />
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
