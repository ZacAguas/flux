/**
 * Volume rendering types
 */

import type * as THREE from 'three';

/**
 * Transfer function control point
 */
export interface TransferFunctionPoint {
  value: number; // Intensity value (normalized 0-1)
  color: { r: number; g: number; b: number }; // RGB (0-255)
  opacity: number; // Alpha (0-1)
}

/**
 * Transfer function configuration
 */
export interface TransferFunction {
  points: TransferFunctionPoint[];
  range: { min: number; max: number }; // Data range for mapping
}

/**
 * Transfer function preset
 */
export interface TransferFunctionPreset {
  name: string;
  description: string;
  points: TransferFunctionPoint[];
}

/**
 * Slice orientation types
 */
export const SliceOrientation = {
  AXIAL: 'axial', // XY plane (looking down Z)
  CORONAL: 'coronal', // XZ plane (looking down Y)
  SAGITTAL: 'sagittal', // YZ plane (looking down X)
} as const;

export type SliceOrientation = typeof SliceOrientation[keyof typeof SliceOrientation];

/**
 * Slice viewer configuration
 */
export interface SliceViewConfig {
  orientation: SliceOrientation;
  index: number; // Slice index in the volume
  windowLevel: {
    center: number; // Window center
    width: number; // Window width
  };
}

/**
 * Camera preset positions for medical imaging
 */
export const CameraPreset = {
  ANTERIOR: 'anterior',
  POSTERIOR: 'posterior',
  LEFT: 'left',
  RIGHT: 'right',
  SUPERIOR: 'superior',
  INFERIOR: 'inferior',
} as const;

export type CameraPreset = typeof CameraPreset[keyof typeof CameraPreset];

/**
 * Rendering quality settings
 */
export interface RenderQuality {
  samplingRate: number; // Samples per unit length for raymarching
  resolution: number; // Render resolution scale (0-1)
}

/**
 * Volume rendering state
 */
export interface VolumeRenderState {
  texture: THREE.Data3DTexture | null;
  transferFunction: TransferFunction;
  quality: RenderQuality;
  timeStep?: number; // Current time step for 4D data
}
