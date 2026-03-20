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
 * Raymarching quality presets
 */
export type RenderQualityPreset = 'draft' | 'standard' | 'high' | 'custom';

/**
 * Raymarching rendering parameters
 */
export interface RaymarchSettings {
  stepSize: number; // Distance between samples (0.001-0.1)
  opacity: number; // Global opacity multiplier (0-1)
  threshold: number; // Minimum intensity to render (lower bound, 0-1)
  thresholdMax: number; // Maximum intensity to render (upper bound, 0-1)
  qualityPreset: RenderQualityPreset; // Current quality preset
  shadingEnabled: boolean; // Blinn-Phong shading on/off (requires gradient texture)
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
