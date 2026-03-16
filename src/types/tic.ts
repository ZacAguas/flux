/**
 * Time Intensity Curve (TIC) Types
 *
 * Type definitions for TIC ROI placement and curve data.
 * TIC analysis is only meaningful for 4D volumes.
 */

import type { SliceOrientation } from './layout';

/**
 * A circular region of interest placed on a slice for TIC analysis.
 * Coordinates are stored as in-plane voxel indices (not mm).
 */
export interface TicROI {
  id: string;
  label: string; // "ROI 1", "ROI 2", etc.
  color: string;
  orientation: SliceOrientation;
  sliceIndex: number; // Depth voxel index where the ROI was placed
  centerIndex1: number; // In-plane voxel coord 1 (x for axial, x for coronal, y for sagittal)
  centerIndex2: number; // In-plane voxel coord 2 (y for axial, z for coronal, z for sagittal)
  radiusVoxels: number; // Radius in in-plane voxel units
  createdAt: number; // Unix timestamp (ms)
}

/**
 * Extracted intensity curve for a single ROI across all time steps.
 */
export interface TicCurve {
  roiId: string;
  intensities: number[]; // Mean voxel intensity per time step (raw, un-normalized)
  timeAxis: number[]; // In seconds if TR available, else step index (0-based)
}

/**
 * In-progress drag state for ROI placement preview.
 */
export interface TicDragPreview {
  orientation: SliceOrientation;
  centerIndex1: number;
  centerIndex2: number;
  radiusVoxels: number;
}

/**
 * Color palette for TIC ROIs. Cycles when more than 8 ROIs are placed.
 */
export const TIC_ROI_COLORS = [
  '#ff4757',
  '#2ed573',
  '#1e90ff',
  '#ffa502',
  '#a29bfe',
  '#fd79a8',
  '#00cec9',
  '#fdcb6e',
] as const;
