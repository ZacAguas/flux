/**
 * Volume texture converter
 *
 * Converts NIfTI volume data to THREE.Data3DTexture for GPU-accelerated rendering.
 * See docs/volume-texture-conversion.md for detailed explanation of design decisions.
 */

import * as THREE from 'three';
import type { NiftiVolume, TypedArray } from '../types';

/**
 * Normalize volume data from [min, max] to [0, 1]
 *
 * @param data - Raw voxel data from NIfTI file
 * @param dataRange - Min and max values in the dataset
 * @returns Normalized Float32Array with values in [0, 1] range
 */
function normalizeVolumeData(
  data: TypedArray,
  dataRange: { min: number; max: number }
): Float32Array {
  const normalized = new Float32Array(data.length);
  const range = dataRange.max - dataRange.min;

  // Handle edge case of constant data
  if (range === 0) {
    normalized.fill(0.5);
    return normalized;
  }

  for (let i = 0; i < data.length; i++) {
    normalized[i] = (data[i] - dataRange.min) / range;
  }

  return normalized;
}

/**
 * Extract single time step from 4D volume data
 *
 * @param data - Full 4D volume data array
 * @param dimensions - Volume dimensions including time
 * @param timeStep - Time step index to extract (0-based)
 * @returns Slice of data for the specified time step
 */
function extractTimeStep(
  data: TypedArray,
  dimensions: { x: number; y: number; z: number; t?: number },
  timeStep: number
): TypedArray {
  const { x, y, z, t } = dimensions;

  // If not 4D, return original data
  if (!t || t === 1) {
    return data;
  }

  // Calculate size of single 3D volume
  const volumeSize = x * y * z;
  const offset = timeStep * volumeSize;

  // Extract the time step data
  return data.slice(offset, offset + volumeSize) as TypedArray;
}

/**
 * Create THREE.Data3DTexture from NIfTI volume data
 *
 * Converts raw voxel data to GPU-friendly format with:
 * - Normalization to [0, 1] range
 * - RedFormat (single channel) to save memory
 * - FloatType for precision
 * - Linear filtering for smooth interpolation
 *
 * @param volume - NIfTI volume with voxel data and metadata
 * @param timeStep - Time step to extract for 4D volumes (default: 0)
 * @returns Configured Data3DTexture ready for GPU upload
 */
export function createVolumeTexture(
  volume: NiftiVolume,
  timeStep = 0
): THREE.Data3DTexture {
  const { dimensions, dataRange } = volume;
  let { data } = volume;

  // Extract single time step if 4D data
  if (dimensions.t && dimensions.t > 1) {
    data = extractTimeStep(data, dimensions, timeStep);
  }

  // Normalize data to 0-1 range
  const normalizedData = normalizeVolumeData(data, dataRange);

  // Create 3D texture
  const texture = new THREE.Data3DTexture(
    normalizedData,
    dimensions.x,
    dimensions.y,
    dimensions.z
  );

  // Configure texture format
  texture.format = THREE.RedFormat; // Single channel intensity
  texture.type = THREE.FloatType; // 32-bit float for precision

  // Set texture filtering for smooth interpolation
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  // Clamp to edge to avoid sampling outside volume
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapR = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  // Set unpack alignment for proper data reading
  texture.unpackAlignment = 1;

  // Mark texture as needing update to upload to GPU
  texture.needsUpdate = true;

  return texture;
}

/**
 * Calculate memory usage of texture in MB
 *
 * @param texture - The 3D texture to analyze
 * @returns Memory usage in megabytes
 */
export function calculateTextureMemory(texture: THREE.Data3DTexture): number {
  const { width, height, depth } = texture.image;
  const bytesPerPixel = texture.type === THREE.FloatType ? 4 : 1;
  const channels = texture.format === THREE.RedFormat ? 1 : 4;
  const bytes = width * height * depth * bytesPerPixel * channels;
  return bytes / (1024 * 1024); // Convert to MB
}

/**
 * Get volume metadata for debugging and display
 *
 * @param volume - NIfTI volume to analyze
 * @returns Formatted metadata including dimensions, spacing, and data range
 */
export function getVolumeInfo(volume: NiftiVolume) {
  const { dimensions, spacing, dataRange } = volume;
  const voxelCount = dimensions.x * dimensions.y * dimensions.z;
  const is4D = dimensions.t && dimensions.t > 1;

  return {
    dimensions: `${dimensions.x} × ${dimensions.y} × ${dimensions.z}${is4D ? ` × ${dimensions.t}` : ''}`,
    spacing: `${spacing.x.toFixed(2)} × ${spacing.y.toFixed(2)} × ${spacing.z.toFixed(2)} mm`,
    voxelCount: voxelCount.toLocaleString(),
    dataRange: `[${dataRange.min.toFixed(2)}, ${dataRange.max.toFixed(2)}]`,
    is4D,
    timeSteps: dimensions.t || 1,
  };
}
