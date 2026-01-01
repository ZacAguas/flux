/**
 * Clipping Plane Controls Component
 *
 * UI controls for enabling/disabling clipping planes and adjusting positions.
 * Provides toggles and sliders for each anatomical plane.
 */

import { Slider, Label, Switch, Button } from '@heroui/react';
import { useViewerStore } from '../../store/viewerStore';

export function ClippingPlaneControls() {
  const layoutMode = useViewerStore((state) => state.layoutMode);
  const clippingPlanes = useViewerStore((state) => state.clippingPlanes);
  const setClippingPlane = useViewerStore((state) => state.setClippingPlane);
  const resetClippingPlanes = useViewerStore((state) => state.resetClippingPlanes);

  // Disable when in slices-only mode
  const isDisabled = layoutMode === 'slices';

  return (
    <div className="flex flex-col gap-3">
      {/* Axial Plane */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-white/50 text-xs font-medium">Axial (Z)</Label>
          <div className="flex items-center gap-2">
            <Switch
              size="sm"
              isSelected={clippingPlanes.axial.inverted}
              isDisabled={isDisabled || !clippingPlanes.axial.enabled}
              onChange={(e) => setClippingPlane('axial', { inverted: e })}
            >
              {({ isSelected }) => (
                <>
                  <Switch.Control
                    className={`backdrop-blur-sm rounded-full ${isSelected ? '' : 'bg-white/15'}`}
                  >
                    <Switch.Thumb />
                  </Switch.Control>
                  <Label className="text-white/40 text-[10px] font-medium">Invert</Label>
                </>
              )}
            </Switch>
            <Switch
              size="sm"
              isSelected={clippingPlanes.axial.enabled}
              isDisabled={isDisabled}
              onChange={(e) => setClippingPlane('axial', { enabled: e })}
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
        </div>
        <Slider
          value={clippingPlanes.axial.position}
          isDisabled={isDisabled || !clippingPlanes.axial.enabled}
          onChange={(value) => setClippingPlane('axial', { position: value as number })}
          minValue={0}
          maxValue={1}
          step={0.01}
          className="w-full"
        >
          <Slider.Output className="text-xs text-white/50">
            {({ state }) => Number(state.getThumbValueLabel(0)).toFixed(2)}
          </Slider.Output>
          <Slider.Track className="bg-white/15 backdrop-blur-sm rounded-md">
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
      </div>

      {/* Coronal Plane */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-white/50 text-xs font-medium">Coronal (Y)</Label>
          <div className="flex items-center gap-2">
            <Switch
              size="sm"
              isSelected={clippingPlanes.coronal.inverted}
              isDisabled={isDisabled || !clippingPlanes.coronal.enabled}
              onChange={(e) => setClippingPlane('coronal', { inverted: e })}
            >
              {({ isSelected }) => (
                <>
                  <Switch.Control
                    className={`backdrop-blur-sm rounded-full ${isSelected ? '' : 'bg-white/15'}`}
                  >
                    <Switch.Thumb />
                  </Switch.Control>
                  <Label className="text-white/40 text-[10px] font-medium">Invert</Label>
                </>
              )}
            </Switch>
            <Switch
              size="sm"
              isSelected={clippingPlanes.coronal.enabled}
              isDisabled={isDisabled}
              onChange={(e) => setClippingPlane('coronal', { enabled: e })}
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
        </div>
        <Slider
          value={clippingPlanes.coronal.position}
          isDisabled={isDisabled || !clippingPlanes.coronal.enabled}
          onChange={(value) => setClippingPlane('coronal', { position: value as number })}
          minValue={0}
          maxValue={1}
          step={0.01}
          className="w-full"
        >
          <Slider.Output className="text-xs text-white/50">
            {({ state }) => Number(state.getThumbValueLabel(0)).toFixed(2)}
          </Slider.Output>
          <Slider.Track className="bg-white/15 backdrop-blur-sm rounded-md">
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
      </div>

      {/* Sagittal Plane */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-white/50 text-xs font-medium">Sagittal (X)</Label>
          <div className="flex items-center gap-2">
            <Switch
              size="sm"
              isSelected={clippingPlanes.sagittal.inverted}
              isDisabled={isDisabled || !clippingPlanes.sagittal.enabled}
              onChange={(e) => setClippingPlane('sagittal', { inverted: e })}
            >
              {({ isSelected }) => (
                <>
                  <Switch.Control
                    className={`backdrop-blur-sm rounded-full ${isSelected ? '' : 'bg-white/15'}`}
                  >
                    <Switch.Thumb />
                  </Switch.Control>
                  <Label className="text-white/40 text-[10px] font-medium">Invert</Label>
                </>
              )}
            </Switch>
            <Switch
              size="sm"
              isSelected={clippingPlanes.sagittal.enabled}
              isDisabled={isDisabled}
              onChange={(e) => setClippingPlane('sagittal', { enabled: e })}
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
        </div>
        <Slider
          value={clippingPlanes.sagittal.position}
          isDisabled={isDisabled || !clippingPlanes.sagittal.enabled}
          onChange={(value) => setClippingPlane('sagittal', { position: value as number })}
          minValue={0}
          maxValue={1}
          step={0.01}
          className="w-full"
        >
          <Slider.Output className="text-xs text-white/50">
            {({ state }) => Number(state.getThumbValueLabel(0)).toFixed(2)}
          </Slider.Output>
          <Slider.Track className="bg-white/15 backdrop-blur-sm rounded-md">
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
      </div>

      {/* Reset Button */}
      <Button
        size="sm"
        onPress={resetClippingPlanes}
        isDisabled={isDisabled}
        className="bg-transparent! hover:bg-red-500/20 text-white/70 hover:text-red-400 transition-all duration-200 disabled:opacity-30 border border-white/10! hover:border-red-500/40!"
      >
        Reset All Planes
      </Button>

      {/* Helper Text */}
      <div className="text-[10px] text-white/40 italic">
        Drag planes in 3D view or use sliders above
      </div>
    </div>
  );
}
