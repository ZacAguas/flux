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
const intersectBox = (rayOrigin: THREE.VarNode, rayDir: THREE.VarNode) => {
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
  // Inverse of the mesh's world matrix. Transforms world coordinates to local object space
  // Important for positioning rays correctly relative to the possibly scaled/rotated volume
  const inverseModelMatrixUniform = uniform(new THREE.Matrix4());
  // Flag to indicate if the current camera is orthographic (1.0) or perspective (0.0)
  const isOrthoUniform = uniform(0.0); // 0 = Perspective, 1 = Ortho
  // Stores the camera's world direction, used for orthographic ray generation as rays are parallel
  const cameraDirUniform = uniform(new THREE.Vector3(0, 0, -1));

  // Create texture node
  const volumeTextureNode = texture3D(volumeTexture);

  /**
   * Main raymarching function
   * - Supports both perspective and orthographic cameras
   * @summary Performs raymarching through the volume and accumulates color
   * @returns RGBA color after raymarching
   */
  const raymarchVolume = Fn(() => {
    // Transform positions to local space
    // Assumes object is a unit cube centered at origin in local space (-0.5 to 0.5)
    const localCameraPos = inverseModelMatrixUniform.mul(vec4(cameraPosition, 1.0)).xyz;
    const localPos = inverseModelMatrixUniform.mul(vec4(positionWorld, 1.0)).xyz;

    // Initialize variables
    const rayDir = vec3(0.0, 0.0, 0.0).toVar();
    const rayOrigin = vec3(0.0, 0.0, 0.0).toVar();

    // Conditional ray generation based on camera type
    // This prevents clipping artifacts and distortion when using an orthographic camera
    If(isOrthoUniform.greaterThan(0.5), () => {
      // For orthographic projection, rays are parallel
      // Transform the world-space camera direction into local object space (rotation only)
      rayDir.assign(normalize(inverseModelMatrixUniform.mul(vec4(cameraDirUniform, 0.0)).xyz));

      // Virtual origin: to find entry point, backtrack from fragment's position
      // localPos is exit point (on back face of volume due to side: THREE.BackSide)
      // Extend the ray backwards by a safe distance (eg. 3.0, greater than cube diagonal sqrt(3))
      // and then shift to texture space [0,1] for intersectBox
      rayOrigin.assign(localPos.sub(rayDir.mul(3.0)).add(0.5));
    }).Else(() => {
      // For perspective projection, rays originate from the camera position
      // Ray direction is from camera to fragment, both in local space
      rayDir.assign(normalize(localPos.sub(localCameraPos)));

      // Ray origin is the camera position, shifted to texture space [0, 1] for intersectBox
      rayOrigin.assign(localCameraPos.add(0.5));
    });

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
    inverseModelMatrix: inverseModelMatrixUniform,
    isOrtho: isOrthoUniform,
    cameraWorldDirection: cameraDirUniform,
  };

  return material;
}

/**
 * Update raymarching parameters (call when parameters change)
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

/**
 * Update camera-related uniforms (isOrtho, cameraWorldDirection)
 * Should be called every frame from the render loop
 * @param material The raymarching material
 * @param camera The current Three.js camera
 */
export function updateRaymarchCameraUniforms(
  material: THREE.MeshBasicNodeMaterial,
  camera: THREE.Camera
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uniforms = (material as any).uniforms;
  if (!uniforms) return;

  if (uniforms.isOrtho) {
    // Set isOrtho uniform based on the camera type
    // Drives the conditional ray generation in the shader
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    uniforms.isOrtho.value = (camera as any).isOrthographicCamera ? 1.0 : 0.0;
  }
  if (uniforms.cameraWorldDirection) {
    // Update the camera's world direction vector for orthographic ray calculation
    camera.getWorldDirection(uniforms.cameraWorldDirection.value);
  }
}

/**
 * Update mesh-related uniforms (inverseModelMatrix)
 * Should be called when the mesh's position, rotation, or scale changes
 * For static meshes, can be called once on initialization
 * @param material The raymarching material
 * @param mesh The Three.js mesh representing the volume
 */
export function updateRaymarchMeshUniforms(
  material: THREE.MeshBasicNodeMaterial,
  mesh: THREE.Mesh
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uniforms = (material as any).uniforms;
  if (!uniforms) return;

  if (uniforms.inverseModelMatrix) {
    // Ensure the mesh's world matrix is up to date, then calculate and pass its inverse
    // Transforms world coordinates into mesh's local space.
    mesh.updateMatrixWorld();
    uniforms.inverseModelMatrix.value.copy(mesh.matrixWorld).invert();
  }
}
