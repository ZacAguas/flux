/**
 * Gradient texture computation (WebGPU compute shader)
 *
 * Computes a gradient texture from a normalized volume data texture using
 * central differences on the GPU. The result is a Storage3DTexture where:
 *   RGB = normalized gradient direction (surface normal)
 *   A   = gradient magnitude (boundary strength)
 *
 * Used for Blinn-Phong shading in the volume raymarcher.
 *
 * NOTE: Gradient is computed in voxel index space (not physical mm space).
 * For anisotropic volumes (non-uniform voxel spacing), normals will be slightly
 * biased toward axes with finer resolution.
 * TODO: Add spacing-corrected gradient for physically accurate normals
 *
 * PERF: Output texture is 4x the memory of the input scalar texture (RGBA float32).
 * For large volumes (>256^3) this may be expensive. Could use rgba16float if memory is tight.
 */

import * as THREE from 'three/webgpu';
import {
  Fn,
  instanceIndex,
  texture3D,
  textureStore,
  ivec3,
  vec3,
  vec4,
  float,
  int,
} from 'three/tsl';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any;

/**
 * Compute gradient texture from a normalized volume texture using a WebGPU compute shader.
 *
 * @param renderer - WebGPU renderer (used to dispatch the compute shader)
 * @param volumeTexture - Normalized scalar volume (Data3DTexture, values in [0, 1])
 * @param width - Volume x dimension
 * @param height - Volume y dimension
 * @param depth - Volume z dimension
 * @returns Storage3DTexture with gradient direction (RGB) and magnitude (A)
 */
export async function computeGradientTexture(
  renderer: THREE.WebGPURenderer,
  volumeTexture: THREE.Data3DTexture,
  width: number,
  height: number,
  depth: number
): Promise<THREE.Storage3DTexture> {
  // Storage3DTexture defaults to rgba32float when written via textureStore
  const storageTexture = new THREE.Storage3DTexture(width, height, depth);
  storageTexture.generateMipmaps = false;

  const computeGradients = Fn(() => {
    const id = instanceIndex;
    const x = id.mod(width).toVar();
    const y = id.div(width).mod(height).toVar();
    const z = id.div(width * height).toVar();

    // HACK: texture3D(...).setSampler(false) used instead of textureLoad() because otherwise auto-generated WGSL assumes vec2<i32> instead of vec3
    // See: https://github.com/mrdoob/three.js/issues/33093
    const sampleAt = (sx: TSLNode, sy: TSLNode, sz: TSLNode): TSLNode => {
      const cx = sx.clamp(0, width - 1);
      const cy = sy.clamp(0, height - 1);
      const cz = sz.clamp(0, depth - 1);
      return texture3D(volumeTexture, ivec3(cx, cy, cz), int(0)).setSampler(false).r;
    };

    // Central differences (2-voxel stencil) for each axis
    const dx = sampleAt(x.add(1), y, z).sub(sampleAt(x.sub(1), y, z));
    const dy = sampleAt(x, y.add(1), z).sub(sampleAt(x, y.sub(1), z));
    const dz = sampleAt(x, y, z.add(1)).sub(sampleAt(x, y, z.sub(1)));

    const grad = vec3(dx, dy, dz);
    const magnitude = grad.length();
    // Avoid division by zero at flat regions
    const normalized = grad.div(magnitude.add(float(1e-6)));

    // NOTE: Central difference magnitude ranges [0, 2] for data in [0,1].
    // Store as-is for use in boundary-strength gating in the raymarcher.
    textureStore(storageTexture, ivec3(x, y, z), vec4(normalized, magnitude));
  });

  const computeNode = computeGradients().compute(width * height * depth);
  await renderer.computeAsync(computeNode);
  return storageTexture;
}
