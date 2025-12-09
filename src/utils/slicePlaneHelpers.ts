/**
 * Slice Plane Helper Utilities
 *
 * Helper functions for creating and managing 3D slice plane indicators
 * in the volume view. These planes show where each 2D slice intersects
 * the 3D volume.
 */

import * as THREE from 'three/webgpu';
import type { NiftiVolume } from '../types/nifti';
import type { SliceOrientation } from '../types/layout';
import { createSliceMaterial } from '../shaders/sliceShader';

/**
 * Create solid color material for slice plane indicator (Colored mode)
 * Uses MeshBasicNodeMaterial with transparency for WebGPU compatibility
 */
export function createColoredSlicePlaneMaterial(
  color: string,
  opacity: number
): THREE.MeshBasicNodeMaterial {
  const material = new THREE.MeshBasicNodeMaterial();
  material.color.set(color);
  material.transparent = true;
  material.opacity = opacity;
  material.side = THREE.DoubleSide; // Visible from both sides
  material.depthWrite = false; // Prevent z-fighting with volume
  material.depthTest = true; // Still respect depth for proper ordering
  return material;
}

/**
 * Create textured material for slice plane indicator (Textured mode)
 * Shows actual slice image data on the plane in 3D space
 */
export function createTexturedSlicePlaneMaterial(
  volumeTexture: THREE.Data3DTexture,
  orientation: SliceOrientation,
  sliceIndex: number,
  dimensions: { x: number; y: number; z: number },
  windowCenter: number,
  windowWidth: number,
  opacity: number
): THREE.MeshBasicNodeMaterial {
  const material = createSliceMaterial(
    volumeTexture,
    orientation,
    sliceIndex,
    dimensions,
    windowCenter,
    windowWidth
  );

  // Configure for 3D visualization
  material.transparent = true;
  material.opacity = opacity;
  material.depthWrite = false; // Prevent z-fighting with volume

  return material;
}

/**
 * Update colored slice plane material color and opacity
 */
export function updateColoredSlicePlaneMaterial(
  material: THREE.MeshBasicNodeMaterial,
  color?: string,
  opacity?: number
): void {
  if (color !== undefined) {
    material.color.set(color);
  }
  if (opacity !== undefined) {
    material.opacity = opacity;
  }
}

/**
 * Calculate world position for slice plane from slice index
 * Matches the coordinate system from sliceInteraction.ts
 */
export function calculateSlicePlanePosition(
  sliceIndex: number,
  orientation: 'axial' | 'coronal' | 'sagittal',
  volume: NiftiVolume
): number {
  const { dimensions, spacing } = volume;

  if (orientation === 'axial') {
    // Z position for axial plane
    return (sliceIndex - dimensions.z / 2) * spacing.z;
  } else if (orientation === 'coronal') {
    // Y position for coronal plane
    return (sliceIndex - dimensions.y / 2) * spacing.y;
  } else {
    // X position for sagittal plane
    return (sliceIndex - dimensions.x / 2) * spacing.x;
  }
}

/**
 * Calculate scale for slice plane to match volume dimensions
 * Planes should span the full width/height of the volume
 */
export function calculateSlicePlaneScale(
  orientation: 'axial' | 'coronal' | 'sagittal',
  volumeDimensions: { width: number; height: number; depth: number }
): { width: number; height: number } {
  if (orientation === 'axial') {
    // XY plane: width=X, height=Y
    return { width: volumeDimensions.width, height: volumeDimensions.height };
  } else if (orientation === 'coronal') {
    // XZ plane: width=X, height=Z
    return { width: volumeDimensions.width, height: volumeDimensions.depth };
  } else {
    // YZ plane: width=Y, height=Z
    return { width: volumeDimensions.height, height: volumeDimensions.depth };
  }
}
