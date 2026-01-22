/**
 * AngleMeasurement Component
 *
 * SVG rendering of an angle measurement with two lines, arc, and label.
 * Full implementation in Phase 3.
 */

import type { NiftiVolume } from '../../types/nifti';
import type { SliceCamera } from '../../types/layout';
import type { AngleMeasurement as AngleMeasurementType } from '../../types/measurement';
import { type ViewportBounds, voxelToPixel } from '../../utils/sliceInteraction';
import { formatAngle } from '../../utils/measurementUtils';
import { MEASUREMENT_COLORS, DEFAULT_MEASUREMENT_SETTINGS } from '../../types/measurement';

interface AngleMeasurementProps {
  measurement: AngleMeasurementType;
  volume: NiftiVolume;
  viewport: ViewportBounds;
  cameraState: SliceCamera;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
}

export function AngleMeasurement({
  measurement,
  volume,
  viewport,
  cameraState,
  isSelected,
  onSelect,
}: AngleMeasurementProps) {
  const { points, color, status, angle } = measurement;
  const [p1, p2, p3] = points;

  // Need at least the first point
  if (!p1) return null;

  // Convert points to local viewport pixel coordinates
  const pixel1 = voxelToPixel(p1, measurement.orientation, volume, viewport, cameraState);
  const local1 = { x: pixel1.x - viewport.x, y: pixel1.y - viewport.y };

  // Display color changes when selected
  const displayColor = isSelected ? MEASUREMENT_COLORS.selected : color;
  const lineWidth = isSelected
    ? DEFAULT_MEASUREMENT_SETTINGS.lineWidth + 1
    : DEFAULT_MEASUREMENT_SETTINGS.lineWidth;

  // If we only have the first point, render just the handle
  if (!p2) {
    return (
      <g>
        <circle
          cx={local1.x}
          cy={local1.y}
          r={DEFAULT_MEASUREMENT_SETTINGS.handleRadius}
          fill={displayColor}
          stroke="white"
          strokeWidth={1}
        />
      </g>
    );
  }

  // Convert second point (vertex)
  const pixel2 = voxelToPixel(p2, measurement.orientation, volume, viewport, cameraState);
  const local2 = { x: pixel2.x - viewport.x, y: pixel2.y - viewport.y };

  // If we only have two points, render line from first to vertex
  if (!p3) {
    return (
      <g>
        {/* Line from first point to vertex */}
        <line
          x1={local1.x}
          y1={local1.y}
          x2={local2.x}
          y2={local2.y}
          stroke={displayColor}
          strokeWidth={lineWidth}
          strokeLinecap="round"
        />
        {/* Handles */}
        <circle
          cx={local1.x}
          cy={local1.y}
          r={DEFAULT_MEASUREMENT_SETTINGS.handleRadius}
          fill={displayColor}
          stroke="white"
          strokeWidth={1}
        />
        <circle
          cx={local2.x}
          cy={local2.y}
          r={DEFAULT_MEASUREMENT_SETTINGS.handleRadius + 1}
          fill={displayColor}
          stroke="white"
          strokeWidth={1}
        />
      </g>
    );
  }

  // Convert third point
  const pixel3 = voxelToPixel(p3, measurement.orientation, volume, viewport, cameraState);
  const local3 = { x: pixel3.x - viewport.x, y: pixel3.y - viewport.y };

  // Calculate arc for angle visualization
  const arcRadius = 25;
  // atan2 gives the angle from the positive x-axis to the vector (dx, dy).
  // Using vertex (local2) as origin, calculate angles to each arm endpoint.
  const angle1 = Math.atan2(local1.y - local2.y, local1.x - local2.x);
  const angle3 = Math.atan2(local3.y - local2.y, local3.x - local2.x);

  // Determine sweep direction (always take the smaller arc)
  const startAngle = angle1;
  const endAngle = angle3;

  // Normalize the angle difference [-PI, PI].
  // Ensures we always draw the smaller arc between the two arms
  let angleDiff = endAngle - startAngle;
  while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
  while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

  // 0 = counter-clockwise, 1 = clockwise
  const sweepFlag = angleDiff < 0 ? 0 : 1;

  // Arc endpoints
  const arcStart = {
    x: local2.x + arcRadius * Math.cos(startAngle),
    y: local2.y + arcRadius * Math.sin(startAngle),
  };
  const arcEnd = {
    x: local2.x + arcRadius * Math.cos(endAngle),
    y: local2.y + arcRadius * Math.sin(endAngle),
  };

  // SVG arc path: M = move to start, A = arc with (rx, ry, rotation, large-arc, sweep, end)
  const arcPath = `M ${arcStart.x} ${arcStart.y} A ${arcRadius} ${arcRadius} 0 0 ${sweepFlag} ${arcEnd.x} ${arcEnd.y}`;

  // Position the label along the bisector (the line that divides the angle in half)
  const bisectorAngle = (startAngle + endAngle) / 2;
  const labelDistance = arcRadius + 20;
  const labelPos = {
    x: local2.x + labelDistance * Math.cos(bisectorAngle),
    y: local2.y + labelDistance * Math.sin(bisectorAngle),
  };

  // Format angle text
  const angleText = angle !== undefined ? formatAngle(angle) : 'Measuring...';
  const textWidth = angleText.length * 7 + 8;
  const textHeight = DEFAULT_MEASUREMENT_SETTINGS.fontSize + 6;

  return (
    <g
      style={{ pointerEvents: 'visiblePainted', cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(isSelected ? null : measurement.id);
      }}
    >
      {/* Line from first point to vertex */}
      <line
        x1={local1.x}
        y1={local1.y}
        x2={local2.x}
        y2={local2.y}
        stroke={displayColor}
        strokeWidth={lineWidth}
        strokeLinecap="round"
      />

      {/* Line from vertex to third point */}
      <line
        x1={local2.x}
        y1={local2.y}
        x2={local3.x}
        y2={local3.y}
        stroke={displayColor}
        strokeWidth={lineWidth}
        strokeLinecap="round"
      />

      {/* Hit areas for easier selection */}
      <line
        x1={local1.x}
        y1={local1.y}
        x2={local2.x}
        y2={local2.y}
        stroke="transparent"
        strokeWidth={10}
      />
      <line
        x1={local2.x}
        y1={local2.y}
        x2={local3.x}
        y2={local3.y}
        stroke="transparent"
        strokeWidth={10}
      />

      {/* Arc showing the angle */}
      <path
        d={arcPath}
        fill="none"
        stroke={displayColor}
        strokeWidth={lineWidth - 0.5}
        strokeLinecap="round"
      />

      {/* Point handles */}
      <circle
        cx={local1.x}
        cy={local1.y}
        r={DEFAULT_MEASUREMENT_SETTINGS.handleRadius}
        fill={displayColor}
        stroke="white"
        strokeWidth={1}
      />
      {/* Vertex handle (slightly larger) */}
      <circle
        cx={local2.x}
        cy={local2.y}
        r={DEFAULT_MEASUREMENT_SETTINGS.handleRadius + 1}
        fill={displayColor}
        stroke="white"
        strokeWidth={1}
      />
      <circle
        cx={local3.x}
        cy={local3.y}
        r={DEFAULT_MEASUREMENT_SETTINGS.handleRadius}
        fill={displayColor}
        stroke="white"
        strokeWidth={1}
      />

      {/* Label */}
      {status === 'complete' && (
        <>
          <rect
            x={labelPos.x - textWidth / 2}
            y={labelPos.y - textHeight / 2}
            width={textWidth}
            height={textHeight}
            rx={3}
            ry={3}
            fill={DEFAULT_MEASUREMENT_SETTINGS.labelBackground}
          />
          <text
            x={labelPos.x}
            y={labelPos.y}
            fill="white"
            fontSize={DEFAULT_MEASUREMENT_SETTINGS.fontSize}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontFamily: 'monospace', fontWeight: 500 }}
          >
            {angleText}
          </text>
        </>
      )}
    </g>
  );
}
