# Volume Raymarching

This document explains the raymarching algorithm used for volume rendering in the medical imaging viewer.

## What is Raymarching?

Raymarching is a technique for rendering 3D volumetric data. Instead of rendering surfaces (like traditional 3D graphics), we:

1. Cast a ray from the camera through each pixel
2. Sample the 3D volume texture at regular intervals along the ray
3. Accumulate color and opacity from samples
4. Composite the final pixel color

## Algorithm Overview

```
For each pixel:
  1. Cast ray from camera through pixel
  2. Find where ray enters/exits the volume (ray-box intersection)
  3. March along ray taking samples
  4. For each sample:
     - Read intensity from 3D texture
     - Apply transfer function (intensity -> color/opacity)
     - Composite with accumulated color (front-to-back blending)
     - Early termination if opacity reaches threshold
  5. Output final pixel color
```

## Coordinate Space and Camera Type Handling

A common challenge in volume rendering is correctly transforming ray parameters (origin, direction) between different coordinate spaces (world, local, texture) and adapting the algorithm for various camera types (Perspective, Orthographic).

### Problem

The initial implementation faced "clipping" or "cutoff" artefacts, where parts of the volume would disappear or appear as unexpected rectangular shapes from certain viewing angles. This was primarily due to two issues:

1. **Incorrect Coordinate Space Transformation**: The raymarching shader assumed that world-space camera and fragment positions could be directly mapped to the volume's texture space (normalised `[0,1]` coordinates). This assumption broke down when the volume mesh was scaled (e.g., to match aspect ratio) or rotated in the 3D scene, leading to a misalignment between the visual representation of the mesh and the internal raymarching calculations.
2. **Camera Type Mismatch**: The application predominantly uses an **Orthographic Camera** for medical imaging views (which projects objects with parallel rays). However, the shader's ray generation logic was inherently designed for a **Perspective Camera** (which projects objects with rays converging to a single point). This fundamental mismatch caused significant distortions and clipping, especially when viewing the volume from side or top/bottom perspectives.

### Solution

The fix involved enhancing the raymarching shader and its controlling React components to correctly handle coordinate spaces and support both camera types dynamically:

* **Shader (`src/shaders/volumeRaymarch.ts`) Enhancements**:
  * **`inverseModelMatrix` Uniform**: A `mat4` uniform was introduced to accurately transform world-space coordinates (camera position, fragment position) into the volume mesh's local space. This ensures all ray calculations happen relative to the mesh's actual orientation and scale.
  * **`isOrtho` and `cameraWorldDirection` Uniforms**: A `float` uniform (`isOrtho`) indicates whether the active camera is orthographic (1.0) or perspective (0.0). A `vec3` uniform (`cameraWorldDirection`) provides the camera's forward vector in world space, crucial for orthographic ray generation.
  * **Conditional Ray Generation Logic**: The shader's `raymarchVolume` function now dynamically adjusts how it generates rays:
    * **Orthographic Camera**: When `isOrtho` is true, the ray's direction is derived from the `cameraWorldDirection` (transformed to local space). The ray's virtual origin is determined by "backing up" from the fragment's position (on the back face of the volume) along this ray, ensuring correct traversal through the volume in a parallel projection.
    * **Perspective Camera**: When `isOrtho` is false, the ray's direction is calculated from the `localCameraPos` to the `localPos` (fragment position), and the ray's origin is set to `localCameraPos`, as is standard for perspective projections.

* **React Component Integration**: All relevant React components (`VolumeRenderer.tsx`, `LayoutSingle.tsx`, `LayoutQuad.tsx`) were updated to correctly compute and pass the `inverseModelMatrix`, `isOrtho` flag, and `cameraWorldDirection` to the shader uniforms every frame (or as needed).

### Refinements and Optimisations

Further refinements were made to optimise performance and reduce code duplication:

* **Optimised `useFrame` Updates**: The `inverseModelMatrix` uniform is now updated only once when the volume mesh is created or its scale/transform explicitly changes (e.g., when new volume data is loaded). This avoids the computationally intensive matrix inversion operation on every frame if the mesh remains static. Camera-related uniforms (`isOrtho`, `cameraWorldDirection`), which change with user interaction, are still updated every frame.
* **Centralised Uniform Update Logic**: Helper functions (`updateRaymarchCameraUniforms` and `updateRaymarchMeshUniforms`) were introduced in `src/shaders/volumeRaymarch.ts`. These functions encapsulate the logic for updating specific sets of uniforms, promoting reusability and maintainability.
* **Code Duplication Reduction**:
  * **`LayoutSingle.tsx`**: This component was refactored to remove its internal, duplicated `VolumeRenderer` implementation. It now directly uses the generic `src/components/VolumeRenderer.tsx` component, which has been enhanced with the optimised rendering logic. Additionally, `LayoutSingle.tsx` now leverages `@react-three/drei`'s declarative `<OrbitControls />` for camera interaction.
  * **`LayoutQuad.tsx`**: Due to its complex, manual multi-viewport rendering setup, `LayoutQuad`'s `ViewportRenderer` continues to manage its scenes and meshes directly. However, it now integrates the new `updateRaymarchCameraUniforms` and `updateRaymarchMeshUniforms` helper functions to apply the optimised uniform updates, significantly reducing duplicated logic within its `useFrame` loop.

These enhancements resolve the rendering artefacts, ensure compatibility with orthographic cameras, and improve the overall maintainability and efficiency of the volume rendering system.

## Ray-Box Intersection

Before raymarching, we need to find where the ray enters and exits the volume bounding box:

```
rayOrigin = camera position (in texture space [0,1])
rayDirection = normalized direction from camera to fragment

For each axis (x, y, z):
  tMin = (boxMin - rayOrigin) / rayDirection
  tMax = (boxMax - rayOrigin) / rayDirection

tNear = max(tMin.x, tMin.y, tMin.z)  // Entry point
tFar = min(tMax.x, tMax.y, tMax.z)   // Exit point
```

If `tNear >= tFar`, the ray misses the box entirely.

## Sampling Strategy

**Step Size**: Distance between samples along the ray

* Smaller = better quality, slower performance
* Larger = faster, but may miss details
* Typical: 0.005 - 0.02 (in normalised texture space)
* Trade-off between quality and speed

**Max Steps**: `(tFar - tNear) / stepSize`

* Calculated dynamically based on ray length
* Ensures consistent quality regardless of viewing angle

## Transfer Function

Maps raw intensity values [0, 1] to visible colors and opacity:

```
intensity -> (red, green, blue, alpha)
```

**Simple Linear (current implementation)**:

```
color = (intensity, intensity, intensity)  // Grayscale
opacity = intensity * opacityScale
```

**Future: Piecewise Linear**:

* Multiple control points defining intensity ranges
* Different colors for different tissue types
* Non-linear opacity curves for emphasis

## Compositing

**Front-to-Back Blending** (current implementation):

```
For each sample along ray (near to far):
  alpha = sample.opacity * (1 - accumulatedOpacity)
  accumulatedColor += sample.color * alpha
  accumulatedOpacity += alpha
```

**Benefits**:

* Early ray termination when opacity reaches ~0.95
* More efficient than back-to-front
* Physically intuitive (closer samples occlude farther ones)

**Alternative: Back-to-Front**:

* Process samples from far to near
* Cannot do early termination
* Less efficient but simpler math

## Optimisations

### 1. Early Ray Termination

Stop marching when accumulated opacity reaches threshold (e.g., 0.95):

```
if (accumulatedOpacity >= 0.95) break;
```

**Impact**: Can skip 50%+ of samples in dense volumes

### 2. Threshold Skipping

Skip samples below minimum intensity threshold:

```
if (intensity < threshold) continue;
```

**Impact**: Significantly faster for volumes with empty space (air in CT scans)

### 3. Empty Space Skipping

Future optimisation: Build acceleration structure to skip empty regions

* Pre-compute min/max values in volume chunks
* Skip chunks that are entirely below threshold
* Similar to octree or brick-based approaches

### 4. Adaptive Sampling

Future optimisation: Vary step size based on volume characteristics

* Larger steps in homogeneous regions
* Smaller steps near boundaries/gradients
* Requires gradient estimation

## TSL vs WGSL

This implementation uses **TSL (Three.js Shading Language)** instead of raw WGSL:

**Advantages**:

* TypeScript syntax and type checking
* Better integration with Three.js
* Backward compatibility with WebGL
* Automatic uniform management
* Cleaner, more maintainable code
* Node-based compositing

**Trade-offs**:

* Slight abstraction overhead
* Debugging happens in compiled WGSL
* Less control over low-level GPU operations

For this application, TSL's benefits far outweigh the trade-offs.

## Performance Characteristics

Typical performance targets:

| Volume Size | Step Size | Target FPS |
|-------------|-----------|------------|
| 128³        | 0.01      | 60 FPS     |
| 256³        | 0.01      | 30-60 FPS  |
| 512³        | 0.01      | 15-30 FPS  |

**Factors affecting performance**:

* Volume dimensions (larger = more memory bandwidth)
* Step size (smaller = more samples per ray)
* Transfer function complexity
* Early termination effectiveness
* GPU capabilities

## Parameter Tuning

**stepSize** (0.005 - 0.02):

* Visual quality vs performance
* Start with 0.01, adjust based on volume detail

**opacity** (0.0 - 2.0):

* Overall visibility of volume
* Higher values make structure more visible
* Too high causes over-saturation

**threshold** (0.0 - 1.0):

* Minimum intensity to render
* Use to hide noise or background
* CT: ~0.1-0.2 to hide air
* MRI: depends on sequence

## Related Files

* `src/shaders/volumeRaymarch.ts` - TSL implementation (now includes uniform update helpers)
* `src/utils/volumeTextureConverter.ts` - 3D texture creation
* `src/components/VolumeRenderer.tsx` - Shared React component wrapper
* `src/components/layouts/LayoutSingle.tsx` - Uses shared `VolumeRenderer`
* `src/components/layouts/LayoutQuad.tsx` - Uses shared uniform update helpers for volume viewport
