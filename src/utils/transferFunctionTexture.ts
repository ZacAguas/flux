/**
 * Transfer Function Texture Generator
 *
 * Generates 1D lookup textures for transfer function application.
 * The shader samples this texture to map intensity values to RGBA colors.
 */

import * as THREE from 'three/webgpu';
import type { TransferFunction, TransferFunctionPoint } from '../types/volume';

const TEXTURE_SIZE = 256; // 256 samples for smooth interpolation

/**
 * Generate a 1D RGBA texture from transfer function control points
 *
 * @param tf - Transfer function with control points
 * @returns DataTexture ready for shader sampling
 */
export function generateTransferFunctionTexture(
  tf: TransferFunction
): THREE.DataTexture {
  const data = new Uint8Array(TEXTURE_SIZE * 4); // RGBA

  // Sort points by value for proper interpolation
  const sortedPoints = [...tf.points].sort((a, b) => a.value - b.value);

  // Generate texture data with piecewise linear interpolation
  for (let i = 0; i < TEXTURE_SIZE; i++) {
    const normalizedValue = i / (TEXTURE_SIZE - 1);

    // Interpolate color and opacity at this intensity value
    const { color, opacity } = interpolateTransferFunction(
      normalizedValue,
      sortedPoints
    );

    const idx = i * 4;
    data[idx + 0] = color.r;
    data[idx + 1] = color.g;
    data[idx + 2] = color.b;
    data[idx + 3] = opacity * 255; // Convert opacity 0-1 -> 0-255
  }

  // Create texture
  const texture = new THREE.DataTexture(
    data,
    TEXTURE_SIZE,
    1,
    THREE.RGBAFormat
  );
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter; // Linear interpolation for smoothness
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping; // Clamp at boundaries

  return texture;
}

/**
 * Interpolate transfer function at a given intensity value
 *
 * Uses piecewise linear interpolation between control points.
 *
 * @param value - Normalized intensity value (0-1)
 * @param points - Sorted array of control points
 * @returns Interpolated color and opacity
 */
function interpolateTransferFunction(
  value: number,
  points: TransferFunctionPoint[]
): { color: { r: number; g: number; b: number }; opacity: number } {
  // Handle edge cases
  if (points.length === 0) {
    return { color: { r: 0, g: 0, b: 0 }, opacity: 0 };
  }
  if (points.length === 1) {
    return { color: points[0].color, opacity: points[0].opacity };
  }

  // Find bracketing control points
  let i = 0;
  while (i < points.length - 1 && points[i + 1].value < value) {
    i++;
  }

  // If we're at or past the last point, use it
  if (i === points.length - 1) {
    return { color: points[i].color, opacity: points[i].opacity };
  }

  // Linear interpolation between points[i] and points[i+1]
  const p0 = points[i];
  const p1 = points[i + 1];

  // Avoid division by zero
  if (p1.value === p0.value) {
    return { color: p0.color, opacity: p0.opacity };
  }

  // Interpolation factor (0-1)
  const t = (value - p0.value) / (p1.value - p0.value);

  // Linearly interpolate color channels
  const color = {
    r: Math.round(p0.color.r + t * (p1.color.r - p0.color.r)),
    g: Math.round(p0.color.g + t * (p1.color.g - p0.color.g)),
    b: Math.round(p0.color.b + t * (p1.color.b - p0.color.b)),
  };

  // Linearly interpolate opacity
  const opacity = p0.opacity + t * (p1.opacity - p0.opacity);

  return { color, opacity };
}
