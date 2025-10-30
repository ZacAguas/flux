/**
 * Volume Raymarching Shader (TSL)
 *
 * Implements GPU-accelerated raymarching through 3D volume texture using
 * Three.js Shading Language (TSL) for three/webgpu.
 *
 * See docs/raymarching.md for algorithm details.
 */

import {
  Fn,
  texture3D,
  vec3,
  vec4,
  float,
  uniform,
  Loop,
  If,
  Break,
  positionWorld,
  cameraPosition,
  normalize,
  max,
  min,
  any,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

/**
 * Ray-box intersection function (inline)
 * Returns entry (tNear) and exit (tFar) distances along ray
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const intersectBox = (rayOrigin: any, rayDir: any) => {
  // Box bounds in texture space [0, 1]
  const boxMin = vec3(0.0, 0.0, 0.0);
  const boxMax = vec3(1.0, 1.0, 1.0);

  // Calculate intersection distances
  const tMin = boxMin.sub(rayOrigin).div(rayDir);
  const tMax = boxMax.sub(rayOrigin).div(rayDir);

  const t1 = min(tMin, tMax);
  const t2 = max(tMin, tMax);

  const tNear = max(max(t1.x, t1.y), t1.z);
  const tFar = min(min(t2.x, t2.y), t2.z);

  return vec3(tNear, tFar, 0.0);
};

/**
 * Simple transfer function (inline)
 * Maps intensity [0, 1] to RGBA with linear opacity
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transferFunction = (intensity: any, opacityScale: any) => {
  // Simple linear opacity mapping
  const opacity = intensity.mul(opacityScale);

  // Grayscale color
  const color = vec3(intensity, intensity, intensity);

  return vec4(color, opacity);
};

/**
 * Create volume raymarching material
 *
 * @param volumeTexture - 3D texture containing volume data
 * @param options - Raymarching parameters
 */
export function createVolumeRaymarchMaterial(
  volumeTexture: THREE.Data3DTexture,
  options: {
    stepSize?: number;
    opacity?: number;
    threshold?: number;
  } = {}
) {
  const {
    stepSize = 0.01,
    opacity = 1.0,
    threshold = 0.1,
  } = options;

  // Create uniforms
  const stepSizeUniform = uniform(stepSize);
  const opacityUniform = uniform(opacity);
  const thresholdUniform = uniform(threshold);

  // Create texture node
  const volumeTextureNode = texture3D(volumeTexture);

  // Main raymarching function
  const raymarchVolume = Fn(() => {
    // Ray direction from camera to fragment
    const rayDir = normalize(positionWorld.sub(cameraPosition));

    // Transform ray to texture space [0, 1]
    // Assuming cube centered at origin with size 1
    const rayOrigin = cameraPosition.add(0.5);

    // Intersect ray with bounding box
    const intersection = intersectBox(rayOrigin, rayDir);
    const tNear = max(intersection.x, float(0.0));
    const tFar = intersection.y;

    // Initialize accumulation
    const accumulatedColor = vec3(0.0, 0.0, 0.0).toVar();
    const accumulatedAlpha = float(0.0).toVar();

    // Only raymarch if there's a valid intersection
    If(tNear.lessThan(tFar), () => {
      // Raymarching parameters
      // PERF: Cap max steps to reduce GPU load (fill rate is the main bottleneck)
      // NOTE: Step cap alone doesn't solve inside-volume performance (see OrbitControls minDistance)
      const calculatedSteps = tFar.sub(tNear).div(stepSizeUniform);
      const maxSteps = min(calculatedSteps, float(256)).toInt();
      const stepIndex = float(0).toVar();

      // Raymarch through volume
      Loop({ start: 0, end: maxSteps }, () => {
        // Early ray termination
        If(accumulatedAlpha.greaterThanEqual(0.95), () => {
          Break();
        });

        // Calculate sample position
        const t = tNear.add(stepIndex.mul(stepSizeUniform));
        const samplePos = rayOrigin.add(rayDir.mul(t));

        // Check bounds
        const outsideBounds = any(samplePos.lessThan(vec3(0.0))).or(
          any(samplePos.greaterThan(vec3(1.0)))
        );

        If(outsideBounds.not(), () => {
          // Sample volume texture
          const intensity = volumeTextureNode.sample(samplePos).r;

          // Apply threshold
          If(intensity.greaterThanEqual(thresholdUniform), () => {
            // Apply transfer function
            const sample = transferFunction(intensity, opacityUniform);

            // Front-to-back compositing
            const alpha = sample.a.mul(float(1.0).sub(accumulatedAlpha));
            accumulatedColor.assign(
              accumulatedColor.add(sample.rgb.mul(alpha))
            );
            accumulatedAlpha.assign(accumulatedAlpha.add(alpha));
          });
        });

        stepIndex.assign(stepIndex.add(1.0));
      });
    });

    return vec4(accumulatedColor, accumulatedAlpha);
  });

  // Create node material
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = raymarchVolume();
  material.transparent = true;
  material.depthWrite = false;
  material.side = THREE.BackSide; // Render from inside the cube

  // Store uniforms for external access
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (material as any).uniforms = {
    stepSize: stepSizeUniform,
    opacity: opacityUniform,
    threshold: thresholdUniform,
  };

  return material;
}

/**
 * Update raymarching parameters
 */
export function updateRaymarchUniforms(
  material: THREE.MeshBasicNodeMaterial,
  params: {
    stepSize?: number;
    opacity?: number;
    threshold?: number;
  }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uniforms = (material as any).uniforms;

  if (params.stepSize !== undefined) {
    uniforms.stepSize.value = params.stepSize;
  }
  if (params.opacity !== undefined) {
    uniforms.opacity.value = params.opacity;
  }
  if (params.threshold !== undefined) {
    uniforms.threshold.value = params.threshold;
  }
}
