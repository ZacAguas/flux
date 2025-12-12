/**
 * Control Point Editor Component
 *
 * Provides precise numeric editing of transfer function control points.
 * Allows users to adjust intensity, opacity, and color values, as well as
 * add and delete control points.
 */

import { Button, Label, Slider } from '@heroui/react';
import { useViewerStore } from '../../store/viewerStore';
import { rgbToHex, hexToRgb } from '../../utils/colorConversion';

interface ControlPointEditorProps {
  selectedPointIndex: number | null;
  onSelectPoint: (index: number | null) => void;
}

export function ControlPointEditor({
  selectedPointIndex,
  onSelectPoint,
}: ControlPointEditorProps) {
  const transferFunction = useViewerStore((state) => state.transferFunction);
  const updatePoint = useViewerStore((state) => state.updateTransferFunctionPoint);
  const addPoint = useViewerStore((state) => state.addTransferFunctionPoint);
  const removePoint = useViewerStore((state) => state.removeTransferFunctionPoint);

  const selectedPoint =
    selectedPointIndex !== null ? transferFunction.points[selectedPointIndex] : null;

  const handleAddPoint = () => {
    // Add a new point in the middle
    addPoint({
      value: 0.5,
      color: { r: 128, g: 128, b: 128 },
      opacity: 0.5,
    });
    // Select the newly added point (it will be sorted, so find its new index)
    const newPoints = [...transferFunction.points, {
      value: 0.5,
      color: { r: 128, g: 128, b: 128 },
      opacity: 0.5,
    }].sort((a, b) => a.value - b.value);
    const newIndex = newPoints.findIndex(
      (p) => p.value === 0.5 && p.color.r === 128 && p.color.g === 128
    );
    onSelectPoint(newIndex);
  };

  const handleRemovePoint = () => {
    if (selectedPointIndex !== null) {
      removePoint(selectedPointIndex);
      onSelectPoint(null);
    }
  };

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
          <div className="flex items-center justify-between">
            <Label className="text-white/50 text-xs font-medium">Color</Label>
            <input
              type="color"
              value={rgbToHex(selectedPoint.color)}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-16 h-8 rounded border border-white/20 bg-transparent cursor-pointer"
            />
          </div>

          {/* Delete Button */}
          <Button
            onPress={handleRemovePoint}
            isDisabled={transferFunction.points.length <= 2}
            className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs border border-red-500/30"
          >
            Delete Point
          </Button>
        </>
      ) : (
        <div className="text-xs text-white/50 text-center py-2">
          Click a control point to edit
        </div>
      )}

      {/* Add Point Button */}
      <Button
        onPress={handleAddPoint}
        className="w-full bg-white/10 hover:bg-white/20 text-white text-xs border border-white/20"
      >
        Add Control Point
      </Button>
    </div>
  );
}
