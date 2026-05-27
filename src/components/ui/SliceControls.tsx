/**
 * Slice Controls Component
 *
 * Three sliders for controlling axial, coronal, and sagittal slice positions.
 * Connected to Zustand store for state management.
 */

import { Slider, Label } from '@heroui/react';
import { useViewerStore } from '../../store/viewerStore';

export function SliceControls() {
  const layoutMode = useViewerStore((state) => state.layoutMode);
  const volume = useViewerStore((state) => state.volume);
  const sliceIndices = useViewerStore((state) => state.sliceIndices);
  const setSliceIndex = useViewerStore((state) => state.setSliceIndex);
  const markDirty = useViewerStore((state) => state.markDirty);

  if (!volume) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* Axial Slider */}
      <Slider
        value={sliceIndices.axial}
        isDisabled={layoutMode === 'single'}
        onChange={(value) => setSliceIndex('axial', value as number)}
        onChangeEnd={markDirty}
        minValue={0}
        maxValue={volume.dimensions.z - 1}
        step={1}
        className="w-full"
      >
        <Label className="text-black/50 dark:text-white/50 text-xs font-medium">Axial</Label>
        <Slider.Output className="text-xs" />
        <Slider.Track className="bg-black/10 dark:bg-white/15 backdrop-blur-sm rounded-md">
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>

      {/* Coronal Slider */}
      <Slider
        value={sliceIndices.coronal}
        isDisabled={layoutMode === 'single'}
        onChange={(value) => setSliceIndex('coronal', value as number)}
        onChangeEnd={markDirty}
        minValue={0}
        maxValue={volume.dimensions.y - 1}
        step={1}
        className="w-full"
      >
        <Label className="text-black/50 dark:text-white/50 text-xs font-medium">Coronal</Label>
        <Slider.Output className="text-xs" />
        <Slider.Track className="bg-black/10 dark:bg-white/15 backdrop-blur-sm rounded-md">
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>

      {/* Sagittal Slider */}
      <Slider
        value={sliceIndices.sagittal}
        isDisabled={layoutMode === 'single'}
        onChange={(value) => setSliceIndex('sagittal', value as number)}
        onChangeEnd={markDirty}
        minValue={0}
        maxValue={volume.dimensions.x - 1}
        step={1}
        className="w-full"
      >
        <Label className="text-black/50 dark:text-white/50 text-xs font-medium">Sagittal</Label>
        <Slider.Output className="text-xs" />
        <Slider.Track className="bg-black/10 dark:bg-white/15 backdrop-blur-sm rounded-md">
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
    </div>
  );
}
