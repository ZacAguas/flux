/**
 * Crop Box Controls Component
 *
 * UI controls for enabling/disabling the crop box and adjusting per-axis bounds.
 * Provides a single enabled toggle and range sliders for each anatomical axis.
 */

import { Slider, Label, Switch, Button } from '@heroui/react';
import { useViewerStore } from '../../store/viewerStore';

export function ClippingPlaneControls() {
  const layoutMode = useViewerStore((state) => state.layoutMode);
  const cropBox = useViewerStore((state) => state.cropBox);
  const setCropBox = useViewerStore((state) => state.setCropBox);
  const setCropBoxAxis = useViewerStore((state) => state.setCropBoxAxis);
  const resetCropBox = useViewerStore((state) => state.resetCropBox);

  // Disable when in slices-only mode
  const isDisabled = layoutMode === 'slices';

  return (
    <div className="flex flex-col gap-3">
      {/* Global enabled toggle */}
      <div className="flex items-center justify-between gap-2">
        <Label className="text-white/50 text-xs font-medium">Enable Crop Box</Label>
        <Switch
          size="sm"
          isSelected={cropBox.enabled}
          isDisabled={isDisabled}
          onChange={(e) => setCropBox({ enabled: e })}
        >
          {({ isSelected }) => (
            <>
              <Switch.Control
                className={`backdrop-blur-sm rounded-full ${isSelected ? '' : 'bg-white/15'}`}
              >
                <Switch.Thumb />
              </Switch.Control>
            </>
          )}
        </Switch>
      </div>

      {/* Axial (Z) range */}
      <div className="flex flex-col gap-2">
        <Slider
          value={[cropBox.axial.min, cropBox.axial.max]}
          isDisabled={isDisabled || !cropBox.enabled}
          onChange={(value) => {
            const [min, max] = value as number[];
            setCropBoxAxis('axial', { min, max });
          }}
          minValue={0}
          maxValue={1}
          step={0.01}
          className="w-full"
        >
          <Label className="text-white/50 text-xs font-medium">Axial (Z)</Label>
          <Slider.Output className="text-xs text-white/50">
            {({ state }) =>
              `${Number(state.getThumbValueLabel(0)).toFixed(2)} \u2013 ${Number(state.getThumbValueLabel(1)).toFixed(2)}`
            }
          </Slider.Output>
          <Slider.Track className="bg-white/15 backdrop-blur-sm rounded-md">
            <Slider.Fill />
            <Slider.Thumb index={0} />
            <Slider.Thumb index={1} />
          </Slider.Track>
        </Slider>
      </div>

      {/* Coronal (Y) range */}
      <div className="flex flex-col gap-2">
        <Slider
          value={[cropBox.coronal.min, cropBox.coronal.max]}
          isDisabled={isDisabled || !cropBox.enabled}
          onChange={(value) => {
            const [min, max] = value as number[];
            setCropBoxAxis('coronal', { min, max });
          }}
          minValue={0}
          maxValue={1}
          step={0.01}
          className="w-full"
        >
          <Label className="text-white/50 text-xs font-medium">Coronal (Y)</Label>
          <Slider.Output className="text-xs text-white/50">
            {({ state }) =>
              `${Number(state.getThumbValueLabel(0)).toFixed(2)} \u2013 ${Number(state.getThumbValueLabel(1)).toFixed(2)}`
            }
          </Slider.Output>
          <Slider.Track className="bg-white/15 backdrop-blur-sm rounded-md">
            <Slider.Fill />
            <Slider.Thumb index={0} />
            <Slider.Thumb index={1} />
          </Slider.Track>
        </Slider>
      </div>

      {/* Sagittal (X) range */}
      <div className="flex flex-col gap-2">
        <Slider
          value={[cropBox.sagittal.min, cropBox.sagittal.max]}
          isDisabled={isDisabled || !cropBox.enabled}
          onChange={(value) => {
            const [min, max] = value as number[];
            setCropBoxAxis('sagittal', { min, max });
          }}
          minValue={0}
          maxValue={1}
          step={0.01}
          className="w-full"
        >
          <Label className="text-white/50 text-xs font-medium">Sagittal (X)</Label>
          <Slider.Output className="text-xs text-white/50">
            {({ state }) =>
              `${Number(state.getThumbValueLabel(0)).toFixed(2)} \u2013 ${Number(state.getThumbValueLabel(1)).toFixed(2)}`
            }
          </Slider.Output>
          <Slider.Track className="bg-white/15 backdrop-blur-sm rounded-md">
            <Slider.Fill />
            <Slider.Thumb index={0} />
            <Slider.Thumb index={1} />
          </Slider.Track>
        </Slider>
      </div>

      {/* Reset Button */}
      <Button
        size="sm"
        onPress={resetCropBox}
        isDisabled={isDisabled}
        className="bg-transparent! hover:bg-red-500/20 text-white/70 hover:text-red-400 transition-all duration-200 disabled:opacity-30 border border-white/10! hover:border-red-500/40!"
      >
        Reset Crop Box
      </Button>

      {/* Helper Text */}
      <div className="text-[10px] text-white/40 italic">
        Drag handles in 3D view or use range sliders above
      </div>
    </div>
  );
}
