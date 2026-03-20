/**
 * 3D Rendering Controls Component
 *
 * Quality preset tabs and sliders for controlling volume rendering parameters.
 * Opacity is now controlled via the Transfer Function Editor.
 * Connected to Zustand store for state management.
 */

import { Slider, Label, Switch, Tabs } from '@heroui/react';
import { useViewerStore } from '../../store/viewerStore';
import type { RenderQualityPreset } from '../../types/volume';

// Quality preset configurations
const QUALITY_PRESETS = {
  draft: { stepSize: 0.02 },
  standard: { stepSize: 0.01 },
  high: { stepSize: 0.005 },
} as const;

export function RenderingControls() {
  const layoutMode = useViewerStore((state) => state.layoutMode);
  const raymarchSettings = useViewerStore((state) => state.raymarchSettings);
  const setRaymarchSettings = useViewerStore((state) => state.setRaymarchSettings);

  // Disable when in slices-only mode (no volume rendering)
  const isDisabled = layoutMode === 'slices';

  // Handle preset selection
  const handlePresetChange = (preset: RenderQualityPreset) => {
    if (preset === 'custom') return;
    setRaymarchSettings({
      ...QUALITY_PRESETS[preset],
      qualityPreset: preset,
    });
  };

  // Handle manual slider changes - switch to custom preset
  const handleManualChange = (key: 'stepSize', value: number) => {
    setRaymarchSettings({
      [key]: value,
      qualityPreset: 'custom',
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Quality Preset Tabs */}
      <div className="flex flex-col gap-1">
        <Label className="text-white/50 text-xs font-medium">Quality</Label>
        <Tabs
          selectedKey={raymarchSettings.qualityPreset}
          onSelectionChange={(key) => handlePresetChange(key.valueOf() as RenderQualityPreset)}
        >
          <Tabs.ListContainer className="w-full">
            <Tabs.List
              aria-label="Quality Preset"
              className="bg-transparent w-full *:flex-1 *:text-center *:px-1 *:py-1 *:text-xs *:text-white/70 *:transition-all *:duration-200 *:data-[selected=true]:text-white *:rounded-md *:bg-transparent gap-1"
            >
              <Tabs.Tab id="draft" isDisabled={isDisabled}>
                Draft
                <Tabs.Indicator className="bg-white/15 backdrop-blur-sm transition-all duration-300 ease-out rounded-md" />
              </Tabs.Tab>
              <Tabs.Tab id="standard" isDisabled={isDisabled}>
                Standard
                <Tabs.Indicator className="bg-white/15 backdrop-blur-sm transition-all duration-300 ease-out rounded-md" />
              </Tabs.Tab>
              <Tabs.Tab id="high" isDisabled={isDisabled}>
                High
                <Tabs.Indicator className="bg-white/15 backdrop-blur-sm transition-all duration-300 ease-out rounded-md" />
              </Tabs.Tab>
              <Tabs.Tab id="custom" isDisabled={isDisabled}>
                Custom
                <Tabs.Indicator className="bg-white/15 backdrop-blur-sm transition-all duration-300 ease-out rounded-md" />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>

      {/* Step Size Slider */}
      <Slider
        value={raymarchSettings.stepSize}
        isDisabled={isDisabled}
        onChange={(value) => handleManualChange('stepSize', value as number)}
        minValue={0.001}
        maxValue={0.1}
        step={0.001}
        className="w-full"
      >
        <Label className="text-white/50 text-xs font-medium">Step Size</Label>
        <Slider.Output className="text-xs">
          {({ state }) => Number(state.getThumbValueLabel(0)).toFixed(3)}
        </Slider.Output>
        <Slider.Track className="bg-white/15 backdrop-blur-sm rounded-md">
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>

      {/* Shading Toggle */}
      <div className="flex items-center justify-between gap-2">
        <Label className="text-white/50 text-xs font-medium">Shading</Label>
        <Switch
          size="sm"
          isSelected={raymarchSettings.shadingEnabled}
          isDisabled={isDisabled}
          onChange={(e) => setRaymarchSettings({ shadingEnabled: e })}
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

      {/* Shading Coefficients (visible when shading is enabled) */}
      {raymarchSettings.shadingEnabled && (
        <>
          <Slider
            value={raymarchSettings.ambientStrength}
            isDisabled={isDisabled}
            onChange={(value) => setRaymarchSettings({ ambientStrength: value as number })}
            minValue={0}
            maxValue={1}
            step={0.01}
            className="w-full"
          >
            <Label className="text-white/50 text-xs font-medium">Ambient</Label>
            <Slider.Output className="text-xs">
              {({ state }) => Number(state.getThumbValueLabel(0)).toFixed(2)}
            </Slider.Output>
            <Slider.Track className="bg-white/15 backdrop-blur-sm rounded-md">
              <Slider.Fill />
              <Slider.Thumb />
            </Slider.Track>
          </Slider>

          <Slider
            value={raymarchSettings.diffuseStrength}
            isDisabled={isDisabled}
            onChange={(value) => setRaymarchSettings({ diffuseStrength: value as number })}
            minValue={0}
            maxValue={1}
            step={0.01}
            className="w-full"
          >
            <Label className="text-white/50 text-xs font-medium">Diffuse</Label>
            <Slider.Output className="text-xs">
              {({ state }) => Number(state.getThumbValueLabel(0)).toFixed(2)}
            </Slider.Output>
            <Slider.Track className="bg-white/15 backdrop-blur-sm rounded-md">
              <Slider.Fill />
              <Slider.Thumb />
            </Slider.Track>
          </Slider>

        </>
      )}

      {/* Threshold Range Slider */}
      <Slider
        value={[raymarchSettings.threshold, raymarchSettings.thresholdMax]}
        isDisabled={isDisabled}
        onChange={(value) => {
          const [min, max] = value as number[];
          setRaymarchSettings({ threshold: min, thresholdMax: max, qualityPreset: 'custom' });
        }}
        minValue={0}
        maxValue={1}
        step={0.01}
        className="w-full"
      >
        <Label className="text-white/50 text-xs font-medium">Threshold</Label>
        <Slider.Output className="text-xs">
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
  );
}
