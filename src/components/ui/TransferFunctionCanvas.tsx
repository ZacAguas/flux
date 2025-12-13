/**
 * Transfer Function Canvas Component
 *
 * Interactive SVG-based visualization using visx for rendering the transfer
 * function curve, control points, and color gradient. Supports dragging control
 * points to modify opacity and intensity values.
 */

import { scaleLinear } from '@visx/scale';
import { LinePath } from '@visx/shape';
import { LinearGradient } from '@visx/gradient';
import { AxisBottom } from '@visx/axis';
import { useViewerStore } from '../../store/viewerStore';
import { rgbToRgbaString } from '../../utils/colorConversion';
import { useState, useRef } from 'react';

interface TransferFunctionCanvasProps {
  selectedPointIndex: number | null;
  onSelectPoint: (index: number | null) => void;
}

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 180;
const MARGIN = { top: 10, right: 10, bottom: 30, left: 10 };
const GRADIENT_HEIGHT = 20;

export function TransferFunctionCanvas({
  selectedPointIndex,
  onSelectPoint,
}: TransferFunctionCanvasProps) {
  const transferFunction = useViewerStore((state) => state.transferFunction);
  const updatePoint = useViewerStore((state) => state.updateTransferFunctionPoint);
  const addPoint = useViewerStore((state) => state.addTransferFunctionPoint);
  const removePoint = useViewerStore((state) => state.removeTransferFunctionPoint);

  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate inner dimensions
  const innerWidth = CANVAS_WIDTH - MARGIN.left - MARGIN.right;

  // Scales
  const xScale = scaleLinear({
    domain: [0, 1],
    range: [MARGIN.left, CANVAS_WIDTH - MARGIN.right],
  });

  const yScale = scaleLinear({
    domain: [0, 1],
    range: [CANVAS_HEIGHT - MARGIN.bottom - GRADIENT_HEIGHT, MARGIN.top],
  });

  // Mouse event handlers for dragging
  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    setDraggedPointIndex(index);
    onSelectPoint(index);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedPointIndex === null || !svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;

    // Convert screen coordinates to data values
    let newValue = xScale.invert(x);
    let newOpacity = yScale.invert(y);

    // Clamp to valid ranges
    newValue = Math.max(0, Math.min(1, newValue));
    newOpacity = Math.max(0, Math.min(1, newOpacity));

    // Update the point
    updatePoint(draggedPointIndex, {
      value: newValue,
      opacity: newOpacity,
    });
  };

  const handleMouseUp = () => {
    setDraggedPointIndex(null);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - svgRect.left;

    // Convert screen coordinates to data values
    const clickValue = Math.max(0, Math.min(1, xScale.invert(x)));

    // Sort points by value to find adjacent points
    const sorted = [...transferFunction.points].sort((a, b) => a.value - b.value);

    // Find the two points that bracket the clicked value
    let leftPoint = sorted[0];
    let rightPoint = sorted[sorted.length - 1];

    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].value <= clickValue && sorted[i + 1].value >= clickValue) {
        leftPoint = sorted[i];
        rightPoint = sorted[i + 1];
        break;
      }
    }

    // Interpolate opacity and color between the two points
    const t = (clickValue - leftPoint.value) / (rightPoint.value - leftPoint.value) || 0;
    // NOTE:We interpolate the opacity instead of using the opacity value where we click, so the new point
    // is created along the existing curve, instead of immediately reshaping the curve (likely unintended)
    const interpolatedOpacity = leftPoint.opacity + (rightPoint.opacity - leftPoint.opacity) * t;
    const interpolatedColor = {
      r: Math.round(leftPoint.color.r + (rightPoint.color.r - leftPoint.color.r) * t),
      g: Math.round(leftPoint.color.g + (rightPoint.color.g - leftPoint.color.g) * t),
      b: Math.round(leftPoint.color.b + (rightPoint.color.b - leftPoint.color.b) * t),
    };

    const newPoint = {
      value: clickValue,
      opacity: interpolatedOpacity,
      color: interpolatedColor,
    };

    // Add the new point
    addPoint(newPoint);

    // Find and select the newly added point
    // The store sorts points after adding, so find where it ended up
    const updatedPoints = useViewerStore.getState().transferFunction.points;
    const newPointIndex = updatedPoints.findIndex(
      (p) => p.value === newPoint.value &&
        p.opacity === newPoint.opacity &&
        p.color.r === newPoint.color.r &&
        p.color.g === newPoint.color.g &&
        p.color.b === newPoint.color.b
    );

    if (newPointIndex !== -1) {
      onSelectPoint(newPointIndex);
    }
  };

  // Sort points by value for rendering
  const sortedPoints = [...transferFunction.points].sort((a, b) => a.value - b.value);

  return (
    <div className="flex flex-col gap-2">
      <svg
        ref={svgRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="bg-white/5 rounded border border-white/20"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* Define linear gradient for color strip */}
        <defs>
          <LinearGradient id="transfer-function-gradient" from="#000" to="#fff">
            {sortedPoints.map((point, i) => (
              <stop
                key={i}
                offset={`${point.value * 100}%`}
                stopColor={`rgb(${point.color.r}, ${point.color.g}, ${point.color.b})`}
              />
            ))}
          </LinearGradient>
        </defs>

        {/* Opacity curve */}
        <LinePath
          data={sortedPoints}
          x={(d) => xScale(d.value)}
          y={(d) => yScale(d.opacity)}
          stroke="white"
          strokeWidth={2}
          strokeOpacity={0.8}
        />

        {/* Control points */}
        {transferFunction.points.map((point, index) => {
          const isSelected = index === selectedPointIndex;
          const isDragging = index === draggedPointIndex;

          return (
            <g key={index}>
              {/* Point circle */}
              <circle
                cx={xScale(point.value)}
                cy={yScale(point.opacity)}
                r={isSelected || isDragging ? 6 : 4}
                fill={rgbToRgbaString(point.color, point.opacity)}
                stroke={isSelected || isDragging ? '#ffffff' : 'rgba(255,255,255,0.5)'}
                strokeWidth={2}
                // Disable transitions on points when dragging to avoid lagging behind line
                className={`cursor-move ${isDragging ? '' : 'transition-all'}`}
                onMouseDown={handleMouseDown(index)}
                onClick={(e) => {
                  // Alt/Option + click to delete point (minimum 2 points required)
                  if (e.altKey && transferFunction.points.length > 2) {
                    removePoint(index);
                    onSelectPoint(null);
                  } else {
                    onSelectPoint(index);
                  }
                }}
              />
            </g>
          );
        })}

        {/* Color gradient strip */}
        <rect
          x={MARGIN.left}
          y={CANVAS_HEIGHT - MARGIN.bottom - GRADIENT_HEIGHT + 5}
          width={innerWidth}
          height={GRADIENT_HEIGHT - 5}
          fill="url(#transfer-function-gradient)"
          stroke="white"
          strokeWidth={1}
          strokeOpacity={0.3}
          rx={2}
        />

        {/* Axis */}
        <AxisBottom
          top={CANVAS_HEIGHT - MARGIN.bottom}
          scale={xScale}
          numTicks={5}
          stroke="rgba(255, 255, 255, 0.2)"
          tickStroke="rgba(255, 255, 255, 0.2)"
          tickLabelProps={() => ({
            fill: 'rgba(255, 255, 255, 0.5)',
            fontSize: 10,
            textAnchor: 'middle',
          })}
        />

        {/* Y-axis label */}
        <text
          x={MARGIN.left + 5}
          y={MARGIN.top + 10}
          fill="rgba(255, 255, 255, 0.5)"
          fontSize={10}
        >
          Opacity
        </text>
        <text
          x={MARGIN.left + 5}
          y={CANVAS_HEIGHT - MARGIN.bottom - 5}
          fill="rgba(255, 255, 255, 0.5)"
          fontSize={10}
        >
          0.0
        </text>
        <text
          x={MARGIN.left + 5}
          y={MARGIN.top + 25}
          fill="rgba(255, 255, 255, 0.5)"
          fontSize={10}
        >
          1.0
        </text>
      </svg>
    </div>
  );
}
