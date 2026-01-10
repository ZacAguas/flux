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
 * Test if a sample position is clipped by any enabled clipping plane
 * Returns true if the position should be clipped (discarded)
 */
const isClipped = (
  samplePos: any,
  clippingAxial: any,
  clippingCoronal: any,
  clippingSagittal: any,
  clippingEnabled: any,
  clippingInverted: any
) => {
  // Test each plane: position < planePos means "behind" plane (clipped)
  // If inverted, flip to clip the opposite side (position > planePos)

  const axialDist = samplePos.z.sub(clippingAxial.w);
  const axialSign = clippingInverted.x.greaterThan(0.5).select(float(-1.0), float(1.0));
  const axialClipped = clippingEnabled.x.greaterThan(0.5).and(axialDist.mul(axialSign).lessThan(0.0));

  const coronalDist = samplePos.y.sub(clippingCoronal.w);
  const coronalSign = clippingInverted.y.greaterThan(0.5).select(float(-1.0), float(1.0));
  const coronalClipped = clippingEnabled.y.greaterThan(0.5).and(coronalDist.mul(coronalSign).lessThan(0.0));

  const sagittalDist = samplePos.x.sub(clippingSagittal.w);
  const sagittalSign = clippingInverted.z.greaterThan(0.5).select(float(-1.0), float(1.0));
  const sagittalClipped = clippingEnabled.z.greaterThan(0.5).and(sagittalDist.mul(sagittalSign).lessThan(0.0));

  return axialClipped.or(coronalClipped).or(sagittalClipped);
};

/**
 * Transfer function using 1D texture lookup
 * Maps intensity [0, 1] to RGBA using pre-generated lookup texture
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createTransferFunction = (transferFunctionTextureNode: any) => {
  return (intensity: any) => {
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
  } = {}
) {
  const {
    stepSize = 0.01,
    threshold = 0.1,
  } = options;

  // Create uniforms
  const stepSizeUniform = uniform(stepSize);
  const thresholdUniform = uniform(threshold);
  // Inverse of the mesh's world matrix. Transforms world coordinates to local object space
  // Important for positioning rays correctly relative to the possibly scaled/rotated volume
  const inverseModelMatrixUniform = uniform(new THREE.Matrix4());
  // Flag to indicate if the current camera is orthographic (1.0) or perspective (0.0)
  const isOrthoUniform = uniform(0.0); // 0 = Perspective, 1 = Ortho
  // Stores the camera's world direction, used for orthographic ray generation as rays are parallel
  const cameraDirUniform = uniform(new THREE.Vector3(0, 0, -1));

  // Clipping plane uniforms
  // Format: vec4(normalX, normalY, normalZ, distance)
  // For axis-aligned planes: normal is unit vector, distance is position [0,1]
  const clippingPlaneAxialUniform = uniform(new THREE.Vector4(0, 0, 1, 0.5));
  const clippingPlaneCoronalUniform = uniform(new THREE.Vector4(0, 1, 0, 0.5));
  const clippingPlaneSagittalUniform = uniform(new THREE.Vector4(1, 0, 0, 0.5));
  const clippingEnabledUniform = uniform(new THREE.Vector3(0, 0, 0)); // x=axial, y=coronal, z=sagittal
  const clippingInvertedUniform = uniform(new THREE.Vector3(0, 0, 0)); // x=axial, y=coronal, z=sagittal

  // Create texture nodes
  const volumeTextureNode = texture3D(volumeTexture);
  const transferFunctionTextureNode = texture(transferFunctionTexture);

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
          // Check clipping planes
          const clipped = isClipped(
            samplePos,
            clippingPlaneAxialUniform,
            clippingPlaneCoronalUniform,
            clippingPlaneSagittalUniform,
            clippingEnabledUniform,
            clippingInvertedUniform
          );

          If(clipped.not(), () => {
            // Sample volume texture
            const intensity = volumeTextureNode.sample(samplePos).r;

            // Apply threshold
            If(intensity.greaterThanEqual(thresholdUniform), () => {
              // Apply transfer function (texture lookup)
              const sample = transferFunction(intensity);

              // Front-to-back compositing
              const alpha = sample.a.mul(float(1.0).sub(accumulatedAlpha));
              accumulatedColor.assign(
                accumulatedColor.add(sample.rgb.mul(alpha))
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
    volumeTexture: volumeTextureNode,
    transferFunctionTexture: transferFunctionTextureNode,
    inverseModelMatrix: inverseModelMatrixUniform,
    isOrtho: isOrthoUniform,
    cameraWorldDirection: cameraDirUniform,
    clippingPlaneAxial: clippingPlaneAxialUniform,
    clippingPlaneCoronal: clippingPlaneCoronalUniform,
    clippingPlaneSagittal: clippingPlaneSagittalUniform,
    clippingEnabled: clippingEnabledUniform,
    clippingInverted: clippingInvertedUniform,
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
 * Update clipping plane uniforms
 * @param material The raymarching material
 * @param planes Clipping plane configurations
 */
export function updateClippingPlaneUniforms(
  material: THREE.MeshBasicNodeMaterial,
  planes: {
    axial?: { enabled: boolean; position: number; inverted: boolean };
    coronal?: { enabled: boolean; position: number; inverted: boolean };
    sagittal?: { enabled: boolean; position: number; inverted: boolean };
  }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uniforms = (material as any).uniforms;
  if (!uniforms) return;

  const enabled = new THREE.Vector3(
    planes.axial?.enabled ? 1.0 : 0.0,
    planes.coronal?.enabled ? 1.0 : 0.0,
    planes.sagittal?.enabled ? 1.0 : 0.0
  );

  const inverted = new THREE.Vector3(
    planes.axial?.inverted ? 1.0 : 0.0,
    planes.coronal?.inverted ? 1.0 : 0.0,
    planes.sagittal?.inverted ? 1.0 : 0.0
  );

  if (uniforms.clippingEnabled) {
    uniforms.clippingEnabled.value.copy(enabled);
  }

  if (uniforms.clippingInverted) {
    uniforms.clippingInverted.value.copy(inverted);
  }

  if (planes.axial && uniforms.clippingPlaneAxial) {
    uniforms.clippingPlaneAxial.value.w = planes.axial.position;
  }
  if (planes.coronal && uniforms.clippingPlaneCoronal) {
    uniforms.clippingPlaneCoronal.value.w = planes.coronal.position;
  }
  if (planes.sagittal && uniforms.clippingPlaneSagittal) {
    uniforms.clippingPlaneSagittal.value.w = planes.sagittal.position;
  }
}
