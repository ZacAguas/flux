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
  texture,
  vec2,
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
  dot,
  select,
  fract,
  sin,
} from 'three/tsl';
import * as THREE from 'three/webgpu';
import type { CropBox } from '../types/clipping';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any;

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
 * Transfer function using 1D texture lookup
 * Maps intensity [0, 1] to RGBA using pre-generated lookup texture
 */
const createTransferFunction = (transferFunctionTextureNode: TSLNode) => {
  return (intensity: TSLNode) => {
    // Sample 1D lookup texture
    // Y coordinate is 0.5 (middle of 1px height texture)
    const uvCoord = vec2(intensity, float(0.5));
    const sample = transferFunctionTextureNode.sample(uvCoord);
    return sample; // RGBA from texture
  };
};

/**
 * Create volume raymarching material
 *
 * @param volumeTexture - 3D texture containing volume data
 * @param transferFunctionTexture - 1D texture for transfer function lookup
 * @param options - Raymarching parameters
 */
export function createVolumeRaymarchMaterial(
  volumeTexture: THREE.Data3DTexture,
  transferFunctionTexture: THREE.DataTexture,
  options: {
    stepSize?: number;
    threshold?: number;
    thresholdMax?: number;
    gradientTexture?: THREE.Storage3DTexture;
    shadingEnabled?: boolean;
    ambientStrength?: number;
    diffuseStrength?: number;
  } = {}
) {
  const {
    stepSize = 0.01,
    threshold = 0.1,
    thresholdMax = 1.0,
    gradientTexture,
    ambientStrength = 0.2,
    diffuseStrength = 0.7,
  } = options;

  // Create uniforms
  const stepSizeUniform = uniform(stepSize);
  const thresholdUniform = uniform(threshold);
  const thresholdMaxUniform = uniform(thresholdMax);
  // 1.0 = shading on, 0.0 = shading off. Float so it can be mixed in the shader
  const shadingEnabledUniform = uniform(options.shadingEnabled !== false ? 1.0 : 0.0);
  const ambientStrengthUniform = uniform(ambientStrength);
  const diffuseStrengthUniform = uniform(diffuseStrength);
  // Inverse of the mesh's world matrix. Transforms world coordinates to local object space
  // Important for positioning rays correctly relative to the possibly scaled/rotated volume
  const inverseModelMatrixUniform = uniform(new THREE.Matrix4());
  // Flag to indicate if the current camera is orthographic (1.0) or perspective (0.0)
  const isOrthoUniform = uniform(0.0); // 0 = Perspective, 1 = Ortho
  // Stores the camera's world direction, used for orthographic ray generation as rays are parallel
  const cameraDirUniform = uniform(new THREE.Vector3(0, 0, -1));

  // Crop box uniforms
  // cropBoxMin/Max: vec3 where x=sagittal, y=coronal, z=axial (normalized [0,1])
  const cropBoxEnabledUniform = uniform(0.0);
  const cropBoxMinUniform = uniform(new THREE.Vector3(0.0, 0.0, 0.0));
  const cropBoxMaxUniform = uniform(new THREE.Vector3(1.0, 1.0, 1.0));

  // Create texture nodes
  const volumeTextureNode = texture3D(volumeTexture);
  const transferFunctionTextureNode = texture(transferFunctionTexture);
  // Gradient texture is optional - shading is disabled when not provided
  // NOTE: null uvNode defers UV binding to .sample(). Mip level 0 explicit for Storage3DTexture
  const gradientTextureNode = gradientTexture ? texture3D(gradientTexture, null, 0) : null;

  // Create transfer function with texture node
  const transferFunction = createTransferFunction(transferFunctionTextureNode);

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
    const tFar = intersection.y;

    // Per-pixel jitter: offset tNear by a fraction of one step using a deterministic screen space hash
    // NOTE: This randomises the phase of each ray's sampling grid, breaking the periodic
    // interference (moire) between the ray step grid and the voxel grid
    // See: https://www.metal.graphics/chapter6-randomness-noise
    const jitter = fract(sin(dot(positionWorld.xy, vec2(12.9898, 78.233))).mul(43758.5453));
    const tNear = max(intersection.x, float(0.0)).add(jitter.mul(stepSizeUniform));

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
          // Crop box AABB test: discard samples outside the crop region
          // samplePos.x = sagittal, .y = coronal, .z = axial (normalized [0,1])
          const croppedOut = cropBoxEnabledUniform.greaterThan(0.5).and(
            any(samplePos.lessThan(cropBoxMinUniform)).or(any(samplePos.greaterThan(cropBoxMaxUniform)))
          );

          If(croppedOut.not(), () => {
            // Sample volume texture
            const intensity = volumeTextureNode.sample(samplePos).r;

            // Apply intensity window (lower and upper threshold)
            If(intensity.greaterThanEqual(thresholdUniform).and(intensity.lessThanEqual(thresholdMaxUniform)), () => {
              // Apply transfer function (texture lookup)
              const sample = transferFunction(intensity);

              // Blinn-Phong shading using pre-computed gradient texture
              // Head-light model: L = V = -rayDir, so H = -rayDir and dot(N, H) = dot(N, L) = diffuse
              // NOTE: Both gradient and rayDir are in the same texture/local space
              const litColor = (() => {
                if (!gradientTextureNode) return sample.rgb;

                const gradientSample = gradientTextureNode.sample(samplePos);
                const surfaceNormal = gradientSample.rgb; // Already normalized
                const gradientMagnitude = gradientSample.a;

                // Scale diffuse/specular contribution by gradient magnitude so flat regions only receive ambient light
                const shadingStrength = gradientMagnitude.mul(8.0).min(1.0);

                // Head-light: dot(N, L) = dot(N, -rayDir)
                const diffuse = dot(surfaceNormal, rayDir.negate()).max(float(0.0));

                // Specular: diffuse^2 used instead of high-exponent pow() to give a broad highlight
                const specular = diffuse.mul(diffuse);

                // Ambient applied uniformly: diffuse and specular are gated by shadingStrength
                // so only regions with meaningful gradients (boundaries/surfaces) receive them
                const lighting = ambientStrengthUniform
                  .add(diffuse.mul(diffuseStrengthUniform).mul(shadingStrength))
                  .add(specular.mul(float(0.1)).mul(shadingStrength));

                const shadedColor = sample.rgb.mul(lighting);

                return select(shadingEnabledUniform.greaterThan(0.5), shadedColor, sample.rgb);
              })();

              // Front-to-back compositing
              const alpha = sample.a.mul(float(1.0).sub(accumulatedAlpha));
              accumulatedColor.assign(
                accumulatedColor.add(litColor.mul(alpha))
              );
              accumulatedAlpha.assign(accumulatedAlpha.add(alpha));
            });
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
    threshold: thresholdUniform,
    thresholdMax: thresholdMaxUniform,
    shadingEnabled: shadingEnabledUniform,
    ambientStrength: ambientStrengthUniform,
    diffuseStrength: diffuseStrengthUniform,
    volumeTexture: volumeTextureNode,
    transferFunctionTexture: transferFunctionTextureNode,
    gradientTexture: gradientTextureNode,
    inverseModelMatrix: inverseModelMatrixUniform,
    isOrtho: isOrthoUniform,
    cameraWorldDirection: cameraDirUniform,
    cropBoxEnabled: cropBoxEnabledUniform,
    cropBoxMin: cropBoxMinUniform,
    cropBoxMax: cropBoxMaxUniform,
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
    threshold?: number;
    thresholdMax?: number;
    shadingEnabled?: boolean;
    ambientStrength?: number;
    diffuseStrength?: number;
  }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uniforms = (material as any).uniforms;

  if (params.stepSize !== undefined) {
    uniforms.stepSize.value = params.stepSize;
  }
  if (params.threshold !== undefined) {
    uniforms.threshold.value = params.threshold;
  }
  if (params.thresholdMax !== undefined) {
    uniforms.thresholdMax.value = params.thresholdMax;
  }
  if (params.shadingEnabled !== undefined) {
    uniforms.shadingEnabled.value = params.shadingEnabled ? 1.0 : 0.0;
  }
  if (params.ambientStrength !== undefined) {
    uniforms.ambientStrength.value = params.ambientStrength;
  }
  if (params.diffuseStrength !== undefined) {
    uniforms.diffuseStrength.value = params.diffuseStrength;
  }
}

/**
 * Update volume texture (call when time step changes in 4D data)
 * Avoids recreating the entire material for better performance during playback
 */
export function updateVolumeTexture(
  material: THREE.MeshBasicNodeMaterial,
  texture: THREE.Data3DTexture
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uniforms = (material as any).uniforms;

  if (uniforms.volumeTexture) {
    uniforms.volumeTexture.value = texture;
  }
}

/**
 * Update gradient texture (call when volume changes)
 */
export function updateGradientTexture(
  material: THREE.MeshBasicNodeMaterial,
  gradientTexture: THREE.Storage3DTexture
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uniforms = (material as any).uniforms;

  if (uniforms.gradientTexture) {
    uniforms.gradientTexture.value = gradientTexture;
  }
}

/**
 * Update transfer function texture (call when transfer function changes)
 */
export function updateTransferFunctionTexture(
  material: THREE.MeshBasicNodeMaterial,
  texture: THREE.DataTexture
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uniforms = (material as any).uniforms;

  if (uniforms.transferFunctionTexture) {
    uniforms.transferFunctionTexture.value = texture;
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

/**
 * Update crop box uniforms
 * Coordinate mapping: min/max.x = sagittal, .y = coronal, .z = axial
 * @param material The raymarching material
 * @param cropBox Crop box configuration
 */
export function updateCropBoxUniforms(
  material: THREE.MeshBasicNodeMaterial,
  cropBox: CropBox
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uniforms = (material as any).uniforms;
  if (!uniforms) return;

  if (uniforms.cropBoxEnabled) {
    uniforms.cropBoxEnabled.value = cropBox.enabled ? 1.0 : 0.0;
  }
  if (uniforms.cropBoxMin) {
    uniforms.cropBoxMin.value.set(
      cropBox.sagittal.min,
      cropBox.coronal.min,
      cropBox.axial.min,
    );
  }
  if (uniforms.cropBoxMax) {
    uniforms.cropBoxMax.value.set(
      cropBox.sagittal.max,
      cropBox.coronal.max,
      cropBox.axial.max,
    );
  }
}
