/**
 * Slice Extraction Shader (TSL)
 *
 * GPU-accelerated 2D slice extraction from 3D volume texture using
 * Three.js Shading Language (TSL) for three/webgpu.
 *
 * Supports three orthogonal orientations:
 * - Axial: XY plane (looking down Z axis)
 * - Coronal: XZ plane (looking down Y axis)
 * - Sagittal: YZ plane (looking down X axis)
 */

import {
  Fn,
  texture3D,
  vec3,
  vec4,
  uniform,
  uv,
  clamp,
} from 'three/tsl';
import * as THREE from 'three/webgpu';
import type { SliceOrientation } from '../types/layout';

/**
 * Create slice extraction material
 *
 * @param volumeTexture - 3D texture containing volume data
 * @param orientation - Slice orientation (axial, coronal, sagittal)
 * @param sliceIndex - Slice index (0 to dimensions-1)
 * @param dimensions - Volume dimensions {x, y, z}
 * @param windowCenter - Window center for contrast adjustment
 * @param windowWidth - Window width for contrast adjustment
 */
export function createSliceMaterial(
  volumeTexture: THREE.Data3DTexture,
  orientation: SliceOrientation,
  sliceIndex: number,
  dimensions: { x: number; y: number; z: number },
  windowCenter: number,
  windowWidth: number
) {
  // Create uniforms
  const sliceIndexUniform = uniform(sliceIndex);
  const windowCenterUniform = uniform(windowCenter);
  const windowWidthUniform = uniform(windowWidth);

  // Dimension uniforms for normalized coordinates
  const dimX = uniform(dimensions.x);
  const dimY = uniform(dimensions.y);
  const dimZ = uniform(dimensions.z);

  // Create texture node
  // NOTE: 'as any' casts are due to incomplete type defs in three/tsl
  const volumeTextureNode = texture3D(volumeTexture);

  // Slice sampling function
  const sampleSlice = Fn(() => {
    const uvCoord = uv();
    let texCoord;

    // Map UV [0,1] to 3D texture coordinates based on orientation
    if (orientation === 'axial') {
      // XY plane at Z=sliceIndex
      texCoord = vec3(
        uvCoord.x,
        uvCoord.y,
        sliceIndexUniform.div(dimZ)
      );
    } else if (orientation === 'coronal') {
      // XZ plane at Y=sliceIndex
      texCoord = vec3(
        uvCoord.x,
        sliceIndexUniform.div(dimY),
        uvCoord.y
      );
    } else {
      // Sagittal: YZ plane at X=sliceIndex
      texCoord = vec3(
        sliceIndexUniform.div(dimX),
        uvCoord.x,
        uvCoord.y
      );
    }

    // Sample volume texture
    const intensity = volumeTextureNode.sample(texCoord).r;

    // Apply window/level for contrast adjustment
    // Formula: displayValue = (intensity - (center - width/2)) / width
    // This maps [center - width/2, center + width/2] -> [0, 1]
    const minValue = windowCenterUniform.sub(windowWidthUniform.div(2.0));

    // Normalize intensity to window range
    const normalizedIntensity = intensity.sub(minValue).div(windowWidthUniform);
    const displayValue = clamp(normalizedIntensity, 0.0, 1.0);

    // Return grayscale color
    return vec4(displayValue, displayValue, displayValue, 1.0);
  })();

  // Create material
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = sampleSlice;
  material.side = THREE.DoubleSide;
  material.transparent = false;

  // Store uniforms for later updates
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (material as any).uniforms = {
    sliceIndex: sliceIndexUniform,
    windowCenter: windowCenterUniform,
    windowWidth: windowWidthUniform,
  };

  return material;
}

/**
 * Update slice material parameters
 *
 * @param material - Material created by createSliceMaterial
 * @param params - Parameters to update
 */
export function updateSliceMaterial(
  material: THREE.MeshBasicNodeMaterial,
  params: {
    sliceIndex?: number;
    windowCenter?: number;
    windowWidth?: number;
  }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uniforms = (material as any).uniforms;

  if (uniforms) {
    if (params.sliceIndex !== undefined) {
      uniforms.sliceIndex.value = params.sliceIndex;
    }
    if (params.windowCenter !== undefined) {
      uniforms.windowCenter.value = params.windowCenter;
    }
    if (params.windowWidth !== undefined) {
      uniforms.windowWidth.value = params.windowWidth;
    }
  }
}
