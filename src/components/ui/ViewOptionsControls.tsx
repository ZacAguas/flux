/**
 * View Options Controls Component
 *
 * Toggle controls for view options like crosshairs.
 * Connected to Zustand store for state management.
 */

import { Switch, Label, Slider, Checkbox, CheckboxGroup, Tabs } from '@heroui/react';
import { useViewerStore } from '../../store/viewerStore';

export function ViewOptionsControls() {
  const layoutMode = useViewerStore((state) => state.layoutMode);
  const showCrosshairs = useViewerStore((state) => state.showCrosshairs);
  const setShowCrosshairs = useViewerStore((state) => state.setShowCrosshairs);
  const crosshairSettings = useViewerStore((state) => state.crosshairSettings);
  const setCrosshairSettings = useViewerStore((state) => state.setCrosshairSettings);
  const showSlicePlanes = useViewerStore((state) => state.showSlicePlanes);
  const setShowSlicePlanes = useViewerStore((state) => state.setShowSlicePlanes);
  const slicePlaneSettings = useViewerStore((state) => state.slicePlaneSettings);
  const setSlicePlaneSettings = useViewerStore((state) => state.setSlicePlaneSettings);
  const showMetricOverlays = useViewerStore((state) => state.showMetricOverlays);
  const setShowMetricOverlays = useViewerStore((state) => state.setShowMetricOverlays);

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

      {/* Metric Overlays Toggle */}
      <Switch
        isSelected={showMetricOverlays}
        onChange={setShowMetricOverlays}
      >
        {({ isSelected }) => (
          <>
            <Switch.Control
              className={`backdrop-blur-sm rounded-full ${isSelected ? '' : 'bg-white/15'}`}
            >
              <Switch.Thumb />
            </Switch.Control>
            <Label className="text-white/50 text-xs font-medium">Metric Overlays</Label>
          </>
        )}
      </Switch>

      {/* Slice Planes Checkboxes */}
      {layoutMode === 'quad' && (() => {
        const allPlanes = ['axial', 'coronal', 'sagittal'] as const;
        const selectedPlanes = allPlanes.filter(
          (plane) => slicePlaneSettings.visibility[plane]
        );

        return (
          <div className="flex flex-col gap-2">
            <Checkbox
              isIndeterminate={selectedPlanes.length > 0 && selectedPlanes.length < allPlanes.length}
              isSelected={selectedPlanes.length === allPlanes.length}
              onChange={(isSelected: boolean) => {
                setSlicePlaneSettings({
                  visibility: {
                    axial: isSelected,
                    coronal: isSelected,
                    sagittal: isSelected,
                  },
                });
                setShowSlicePlanes(isSelected);
              }}
            >
              <Checkbox.Control className="backdrop-blur-sm">
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>
                <Label className="text-white/50 text-xs font-medium">Slice Planes</Label>
              </Checkbox.Content>
            </Checkbox>

            <div className="ml-6 flex flex-col gap-2">
              <CheckboxGroup
                className="[&_[data-slot='checkbox']]:mt-1"
                value={selectedPlanes as unknown as string[]}
                onChange={(values) => {
                  const newVisibility = {
                    axial: values.includes('axial'),
                    coronal: values.includes('coronal'),
                    sagittal: values.includes('sagittal'),
                  };
                  setSlicePlaneSettings({ visibility: newVisibility });
                  setShowSlicePlanes(values.length > 0);
                }}
              >
                <Checkbox value="axial">
                  <Checkbox.Control className="backdrop-blur-sm">
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Content>
                    <Label className="text-white/50 text-xs font-medium">Axial</Label>
                  </Checkbox.Content>
                </Checkbox>

                <Checkbox value="coronal">
                  <Checkbox.Control className="backdrop-blur-sm">
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Content>
                    <Label className="text-white/50 text-xs font-medium">Coronal</Label>
                  </Checkbox.Content>
                </Checkbox>

                <Checkbox value="sagittal">
                  <Checkbox.Control className="backdrop-blur-sm">
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Content>
                    <Label className="text-white/50 text-xs font-medium">Sagittal</Label>
                  </Checkbox.Content>
                </Checkbox>
              </CheckboxGroup>
            </div>

            {/* Slice Plane Mode Selector */}
            {selectedPlanes.length > 0 && (
              <div className="flex flex-col gap-1">
                <Label className="text-white/50 text-xs font-medium">Plane Style</Label>
                <Tabs
                  selectedKey={slicePlaneSettings.mode}
                  onSelectionChange={(key) => setSlicePlaneSettings({ mode: key.valueOf() as 'textured' | 'colored' })}
                >
                  <Tabs.ListContainer>
                    <Tabs.List
                      aria-label="Plane Style"
                      className="bg-transparent *:px-2 *:py-1 *:text-xs *:text-white/70 *:transition-all *:duration-200 *:data-[selected=true]:text-white *:rounded-md *:bg-transparent gap-1"
                    >
                      <Tabs.Tab id="textured">
                        Textured
                        <Tabs.Indicator className="bg-white/15 backdrop-blur-sm transition-all duration-300 ease-out rounded-md" />
                      </Tabs.Tab>
                      <Tabs.Tab id="colored">
                        Colored
                        <Tabs.Indicator className="bg-white/15 backdrop-blur-sm transition-all duration-300 ease-out rounded-md" />
                      </Tabs.Tab>
                    </Tabs.List>
                  </Tabs.ListContainer>
                </Tabs>
              </div>
            )}
          </div>
        );
      })()}

      {/* Slice Plane Opacity Slider */}
      {showSlicePlanes && layoutMode === 'quad' && (
        <Slider
          value={slicePlaneSettings.opacity}
          onChange={(value) => setSlicePlaneSettings({ opacity: value as number })}
          minValue={0}
          maxValue={1}
          step={0.05}
          className="w-full"
        >
          <Label className="text-white/50 text-xs font-medium">Slice Plane Opacity</Label>
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
