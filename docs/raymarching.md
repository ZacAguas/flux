# Volume Raymarching

This document explains the raymarching algorithm used for volume rendering in the medical imaging viewer.

## What is Raymarching?

Raymarching (also called ray casting) is a technique for rendering 3D volumetric data. Instead of rendering surfaces (like traditional 3D graphics), we:

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
     - Apply transfer function (intensity → color/opacity)
     - Composite with accumulated color (front-to-back blending)
     - Early termination if opacity reaches threshold
  5. Output final pixel color
```

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

- Smaller = better quality, slower performance
- Larger = faster, but may miss details
- Typical: 0.005 - 0.02 (in normalized texture space)
- Trade-off between quality and speed

**Max Steps**: `(tFar - tNear) / stepSize`

- Calculated dynamically based on ray length
- Ensures consistent quality regardless of viewing angle

## Transfer Function

Maps raw intensity values [0, 1] to visible colors and opacity:

```
intensity → (red, green, blue, alpha)
```

**Simple Linear (current implementation)**:

```
color = (intensity, intensity, intensity)  // Grayscale
opacity = intensity * opacityScale
```

**Future: Piecewise Linear**:

- Multiple control points defining intensity ranges
- Different colors for different tissue types
- Non-linear opacity curves for emphasis

## Compositing

**Front-to-Back Blending** (current implementation):

```
For each sample along ray (near to far):
  alpha = sample.opacity * (1 - accumulatedOpacity)
  accumulatedColor += sample.color * alpha
  accumulatedOpacity += alpha
```

**Benefits**:

- Early ray termination when opacity reaches ~0.95
- More efficient than back-to-front
- Physically intuitive (closer samples occlude farther ones)

**Alternative: Back-to-Front**:

- Process samples from far to near
- Cannot do early termination
- Less efficient but simpler math

## Optimizations

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

Future optimization: Build acceleration structure to skip empty regions

- Pre-compute min/max values in volume chunks
- Skip chunks that are entirely below threshold
- Similar to octree or brick-based approaches

### 4. Adaptive Sampling

Future optimization: Vary step size based on volume characteristics

- Larger steps in homogeneous regions
- Smaller steps near boundaries/gradients
- Requires gradient estimation

## TSL vs WGSL

This implementation uses **TSL (Three.js Shading Language)** instead of raw WGSL:

**Advantages**:

- TypeScript syntax and type checking
- Better integration with Three.js
- Backward compatibility with WebGL
- Automatic uniform management
- Cleaner, more maintainable code
- Node-based compositing

**Trade-offs**:

- Slight abstraction overhead
- Debugging happens in compiled WGSL
- Less control over low-level GPU operations

For this application, TSL's benefits far outweigh the trade-offs.

## Performance Characteristics

Typical performance targets:

| Volume Size | Step Size | Target FPS |
|-------------|-----------|------------|
| 128³        | 0.01      | 60 FPS     |
| 256³        | 0.01      | 30-60 FPS  |
| 512³        | 0.01      | 15-30 FPS  |

**Factors affecting performance**:

- Volume dimensions (larger = more memory bandwidth)
- Step size (smaller = more samples per ray)
- Transfer function complexity
- Early termination effectiveness
- GPU capabilities

## Parameter Tuning

**stepSize** (0.005 - 0.02):

- Visual quality vs performance
- Start with 0.01, adjust based on volume detail

**opacity** (0.0 - 2.0):

- Overall visibility of volume
- Higher values make structure more visible
- Too high causes over-saturation

**threshold** (0.0 - 1.0):

- Minimum intensity to render
- Use to hide noise or background
- CT: ~0.1-0.2 to hide air
- MRI: depends on sequence

## Current Limitations

### Camera Constraints

**The camera is currently constrained to stay outside the volume** (`minDistance={1.5}` in OrbitControls).

**Reason**: Fill rate bottleneck when camera enters volume:

- **Outside volume**: Volume covers 20-30% of screen → Fast
- **Inside volume**: Volume covers 100% of screen → 3-5x more fragment shader invocations → Severe performance degradation

**Impact**:

- ✅ Consistent 60 FPS performance
- ✅ Better UX (less disorienting)
- ❌ Cannot perform virtual endoscopy/fly-through

**Future improvements** if internal views are needed:

1. **Resolution scaling** - Render volume at lower resolution when inside
2. **Adaptive quality** - Reduce step size/max steps based on screen coverage
3. **Occlusion culling** - Skip fragments behind opaque geometry
4. **Compute shader preprocessing** - Pre-compute visible regions

For now, slice viewers (2D orthogonal views) provide better tools for examining internal anatomy.

## Related Files

- `src/shaders/volumeRaymarch.ts` - TSL implementation
- `src/utils/volumeTextureConverter.ts` - 3D texture creation
- `src/components/VolumeRenderer.tsx` - React component wrapper
