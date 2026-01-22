/**
 * Measurement Utilities
 *
 * Functions for measurement calculations (distance, angle) and formatting.
 * Coordinate transformations are located in sliceInteraction.ts.
 */

import type { NiftiVolume } from '../types/nifti';
import type { SliceOrientation } from '../types/layout';
import type { MeasurementPoint } from '../types/measurement';
import type { PixelPosition } from './sliceInteraction';

/**
 * Get the in-plane voxel spacing for a given orientation.
 * Returns [horizontal spacing, vertical spacing] in mm.
 */
export function getInPlaneSpacing(
  orientation: SliceOrientation,
  spacing: { x: number; y: number; z: number }
): [number, number] {
  switch (orientation) {
    case 'axial':
      // XY plane: horizontal = X spacing, vertical = Y spacing
      return [spacing.x, spacing.y];
    case 'coronal':
      // XZ plane: horizontal = X spacing, vertical = Z spacing
      return [spacing.x, spacing.z];
    case 'sagittal':
      // YZ plane: horizontal = Y spacing, vertical = Z spacing
      return [spacing.y, spacing.z];
  }
}

/**
 * Calculate physical distance between two points in mm.
 * Uses voxel spacing for accurate physical measurement.
 */
export function calculateDistance(
  p1: MeasurementPoint,
  p2: MeasurementPoint,
  orientation: SliceOrientation,
  volume: NiftiVolume
): number {
  const [spacing1, spacing2] = getInPlaneSpacing(orientation, volume.spacing);

  const dx = (p2.index1 - p1.index1) * spacing1;
  const dy = (p2.index2 - p1.index2) * spacing2;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between three points in degrees.
 * The middle point (vertex) is the apex of the angle.
 * Returns angle in range [0, 180].
 */
export function calculateAngle(
  p1: MeasurementPoint,
  vertex: MeasurementPoint,
  p3: MeasurementPoint,
  orientation: SliceOrientation,
  volume: NiftiVolume
): number {
  const [spacing1, spacing2] = getInPlaneSpacing(orientation, volume.spacing);

  // Convert to physical coordinates (mm)
  const v1x = (p1.index1 - vertex.index1) * spacing1;
  const v1y = (p1.index2 - vertex.index2) * spacing2;
  const v2x = (p3.index1 - vertex.index1) * spacing1;
  const v2y = (p3.index2 - vertex.index2) * spacing2;

  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

  // Handle special cases
  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }

  const dot = v1x * v2x + v1y * v2y;

  // Clamp to avoid float errors with acos
  const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));

  // Convert to degrees
  return Math.acos(cosAngle) * (180 / Math.PI);
}

/**
 * Format distance for display.
 */
export function formatDistance(distance: number): string {
  if (distance >= 10) {
    return `${distance.toFixed(1)} mm`;
  } else if (distance >= 1) {
    return `${distance.toFixed(2)} mm`;
  } else {
    return `${distance.toFixed(3)} mm`;
  }
}

/**
 * Format angle for display.
 */
export function formatAngle(angle: number): string {
  return `${angle.toFixed(1)}°`;
}

/**
 * Calculate the midpoint between two points in pixel space.
 * Useful for label placement.
 */
export function getMidpoint(p1: PixelPosition, p2: PixelPosition): PixelPosition {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

/**
 * Calculate offset position for label placement.
 * Offsets perpendicular to the line direction.
 */
export function getLabelOffset(
  p1: PixelPosition,
  p2: PixelPosition,
  offset: number = 15
): PixelPosition {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) {
    return { x: offset, y: 0 };
  }

  // Perpendicular direction (rotated 90 degrees)
  const perpX = -dy / length;
  const perpY = dx / length;

  return {
    x: perpX * offset,
    y: perpY * offset,
  };
}
