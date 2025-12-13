/**
 * Control Point Editor Component
 *
 * Provides precise numeric editing of transfer function control points.
 * Allows users to adjust intensity, opacity, and color values, as well as
 * add and delete control points.
 */

import { Label, Slider, Kbd } from '@heroui/react';
import { useViewerStore } from '../../store/viewerStore';
import { rgbToHex, hexToRgb } from '../../utils/colorConversion';

interface ControlPointEditorProps {
  selectedPointIndex: number | null;
  onSelectPoint: (index: number | null) => void;
}

export function ControlPointEditor({
  selectedPointIndex,
}: ControlPointEditorProps) {
  const transferFunction = useViewerStore((state) => state.transferFunction);
  const updatePoint = useViewerStore((state) => state.updateTransferFunctionPoint);

  const selectedPoint =
    selectedPointIndex !== null ? transferFunction.points[selectedPointIndex] : null;

  const handleColorChange = (hex: string) => {
    if (selectedPointIndex !== null) {
      const rgb = hexToRgb(hex);
      updatePoint(selectedPointIndex, { color: rgb });
    }
  };

  const handleIntensityChange = (value: number) => {
    if (selectedPointIndex !== null) {
      updatePoint(selectedPointIndex, { value });
    }
  };

  const handleOpacityChange = (value: number) => {
    if (selectedPointIndex !== null) {
      updatePoint(selectedPointIndex, { opacity: value });
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-white/5 rounded border border-white/20">
      <div className="min-h-[200px] flex flex-col gap-3">
        {selectedPoint ? (
          <>
            <div className="text-xs text-white/50 font-medium">
              Selected Point {selectedPointIndex !== null ? selectedPointIndex + 1 : ''}
            </div>

            {/* Intensity Slider */}
            <Slider
              value={selectedPoint.value}
              onChange={(value) => handleIntensityChange(value as number)}
              minValue={0}
              maxValue={1}
              step={0.01}
              className="w-full"
            >
              <Label className="text-white/50 text-xs font-medium">Intensity</Label>
              <Slider.Output className="text-xs">
                {({ state }) => Number(state.getThumbValueLabel(0)).toFixed(2)}
              </Slider.Output>
              <Slider.Track className="bg-white/15 backdrop-blur-sm rounded-md">
                <Slider.Fill />
                <Slider.Thumb />
              </Slider.Track>
            </Slider>

            {/* Opacity Slider */}
            <Slider
              value={selectedPoint.opacity}
              onChange={(value) => handleOpacityChange(value as number)}
              minValue={0}
              maxValue={1}
              step={0.01}
              className="w-full"
            >
              <Label className="text-white/50 text-xs font-medium">Opacity</Label>
              <Slider.Output className="text-xs">
                {({ state }) => Number(state.getThumbValueLabel(0)).toFixed(2)}
              </Slider.Output>
              <Slider.Track className="bg-white/15 backdrop-blur-sm rounded-md">
                <Slider.Fill />
                <Slider.Thumb />
              </Slider.Track>
            </Slider>

            {/* Color Picker */}
            <div className="flex flex-col gap-1">
              <Label className="text-white/50 text-xs font-medium">Color</Label>
              <input
                type="color"
                value={rgbToHex(selectedPoint.color)}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-full h-5 rounded-md border-0 cursor-pointer
                [&::-webkit-color-swatch-wrapper]:p-0
                [&::-webkit-color-swatch-wrapper]:rounded-md
                [&::-webkit-color-swatch]:border-0
                [&::-webkit-color-swatch]:rounded-md
                [&::-moz-color-swatch]:border-0
                [&::-moz-color-swatch]:rounded-md"
              />
            </div>
          </>
        ) : (
          <div className="text-xs text-white/50 text-center flex items-center justify-center h-full">
            Click a control point to edit
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
        <div className="text-xs text-white/30 font-medium">Shortcuts</div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50 ">Add point</span>
          <Kbd className="text-xs text-white/70 bg-white/15 backdrop-blur-sm rounded-md px-2 py-1">
            <Kbd.Content>Double Click</Kbd.Content>
          </Kbd>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50">Delete point</span>
          <Kbd className="text-xs text-white/70 bg-white/15 backdrop-blur-sm rounded-md px-2 py-1">
            <Kbd.Abbr keyValue="option" />
            <Kbd.Content>Click</Kbd.Content>
          </Kbd>
        </div>
      </div>
    </div>
  );
}
