/**
 * DistanceMeasurement Component
 *
 * SVG rendering of a distance measurement line with handles and label.
 */

import type { NiftiVolume } from '../../types/nifti';
import type { SliceCamera } from '../../types/layout';
import type { DistanceMeasurement as DistanceMeasurementType } from '../../types/measurement';
import { type ViewportBounds, voxelToPixel } from '../../utils/sliceInteraction';
import {
  formatDistance,
  getMidpoint,
  getLabelOffset,
} from '../../utils/measurementUtils';
import { MEASUREMENT_COLORS, DEFAULT_MEASUREMENT_SETTINGS } from '../../types/measurement';

interface DistanceMeasurementProps {
  measurement: DistanceMeasurementType;
  volume: NiftiVolume;
  viewport: ViewportBounds;
  cameraState: SliceCamera;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
}

export function DistanceMeasurement({
  measurement,
  volume,
  viewport,
  cameraState,
  isSelected,
  onSelect,
}: DistanceMeasurementProps) {
  const { points, color, status, distance } = measurement;
  const [p1, p2] = points;

  // Need at least the first point
  if (!p1) return null;

  // Convert voxel coordinates to local viewport pixel coordinates
  const pixel1 = voxelToPixel(p1, measurement.orientation, volume, viewport, cameraState);
  // Convert to local coordinates within the SVG
  const local1 = { x: pixel1.x - viewport.x, y: pixel1.y - viewport.y };

  // If we only have the first point (placing), render just the handle
  if (!p2) {
    return (
      <g>
        {/* First point handle */}
        <circle
          cx={local1.x}
          cy={local1.y}
          r={DEFAULT_MEASUREMENT_SETTINGS.handleRadius}
          fill={color}
          stroke="white"
          strokeWidth={1}
        />
      </g>
    );
  }

  // Convert second point
  const pixel2 = voxelToPixel(p2, measurement.orientation, volume, viewport, cameraState);
  const local2 = { x: pixel2.x - viewport.x, y: pixel2.y - viewport.y };

  // Calculate label position (midpoint with perpendicular offset)
  const midpoint = getMidpoint(local1, local2);
  const labelOffset = getLabelOffset(local1, local2, 15);
  const labelPos = {
    x: midpoint.x + labelOffset.x,
    y: midpoint.y + labelOffset.y,
  };

  // Display color changes when selected
  const displayColor = isSelected ? MEASUREMENT_COLORS.selected : color;
  const lineWidth = isSelected
    ? DEFAULT_MEASUREMENT_SETTINGS.lineWidth + 1
    : DEFAULT_MEASUREMENT_SETTINGS.lineWidth;

  // Format distance text
  const distanceText = distance !== undefined ? formatDistance(distance) : 'Measuring...';

  // Calculate text dimensions for background
  const textWidth = distanceText.length * 7 + 8;
  const textHeight = DEFAULT_MEASUREMENT_SETTINGS.fontSize + 6;

  return (
    <g
      style={{ pointerEvents: 'visiblePainted', cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(isSelected ? null : measurement.id);
      }}
    >
      {/* Main line */}
      <line
        x1={local1.x}
        y1={local1.y}
        x2={local2.x}
        y2={local2.y}
        stroke={displayColor}
        strokeWidth={lineWidth}
        strokeLinecap="round"
      />

      {/* Hit area for easier selection */}
      <line
        x1={local1.x}
        y1={local1.y}
        x2={local2.x}
        y2={local2.y}
        stroke="transparent"
        strokeWidth={10}
      />

      {/* End point handles */}
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
        r={DEFAULT_MEASUREMENT_SETTINGS.handleRadius}
        fill={displayColor}
        stroke="white"
        strokeWidth={1}
      />

      {/* Label background */}
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
          {/* Label text */}
          <text
            x={labelPos.x}
            y={labelPos.y}
            fill="white"
            fontSize={DEFAULT_MEASUREMENT_SETTINGS.fontSize}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontFamily: 'monospace', fontWeight: 500 }}
          >
            {distanceText}
          </text>
        </>
      )}
    </g>
  );
}
