/**
 * Measurement Types
 *
 * Type definitions for distance and angle measurement tools.
 * Measurements are stored as voxel indices and rendered as SVG overlays.
 */

import type { SliceOrientation } from './layout';

/**
 * The currently active measurement tool.
 */
export type MeasurementTool = 'none' | 'distance' | 'angle';

export type MeasurementType = 'distance' | 'angle';

/**
 * A point in a measurement, stored as in-plane voxel indices.
 * The third dimension (slice depth) is stored on the measurement itself.
 */
export interface MeasurementPoint {
  index1: number; // First in-plane voxel index (horizontal axis)
  index2: number; // Second in-plane voxel index (vertical axis)
}

/**
 * Status of a measurement being placed.
 */
export type MeasurementStatus = 'placing' | 'complete';

/**
 * Base properties shared by all measurement types.
 */
export interface BaseMeasurement {
  id: string;
  type: MeasurementType;
  orientation: SliceOrientation;
  sliceIndex: number; // The slice depth where measurement was placed
  status: MeasurementStatus;
  color: string;
  createdAt: number; // Unix timestamp (ms)
}

/**
 * Distance measurement between two points.
 * Distance is calculated in physical mm using voxel spacing.
 */
export interface DistanceMeasurement extends BaseMeasurement {
  type: 'distance';
  points: [MeasurementPoint, MeasurementPoint?]; // Second point optional during placement
  distance?: number; // Calculated distance in mm (only when complete)
}

/**
 * Angle measurement between three points.
 * The middle point is the vertex of the angle.
 */
export interface AngleMeasurement extends BaseMeasurement {
  type: 'angle';
  points: [MeasurementPoint, MeasurementPoint?, MeasurementPoint?]; // Points filled during placement
  angle?: number; // Calculated angle in degrees (only when complete)
}

export type Measurement = DistanceMeasurement | AngleMeasurement;

export const MEASUREMENT_COLORS = {
  distance: '#00ff00', // Green
  angle: '#ffff00',    // Yellow
  selected: '#ff6600', // Orange for selected measurement
} as const;

export const DEFAULT_MEASUREMENT_SETTINGS = {
  lineWidth: 2,
  fontSize: 12,
  labelBackground: 'rgba(0, 0, 0, 0.7)',
  handleRadius: 4,
} as const;
