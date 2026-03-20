# Volume Shading

This document explains the shading model used in the volume raymarcher: how surface normals are derived from the volume data, and how Blinn-Phong lighting is applied per sample.

## Why Shade a Volume?

Without shading, every sample along a ray is lit uniformly: tissue boundaries have no sense of depth or curvature. Shading exploits the fact that intensity changes sharply at tissue boundaries, using the direction of that change as a surface normal to apply directional lighting. The result is a clearer visualisation of 3D structure.

## Gradient as Surface Normal

A surface normal is approximated from the scalar field using **central differences** (the finite difference between neighbouring voxels on each axis):

```
dx = intensity(x+1, y, z) - intensity(x-1, y, z)
dy = intensity(x, y+1, z) - intensity(x, y-1, z)
dz = intensity(x, y, z+1) - intensity(x, y, z-1)

gradient = vec3(dx, dy, dz)
magnitude = length(gradient)
normal = gradient / (magnitude + epsilon)
```

The gradient points in the direction of steepest intensity increase. At a vessel wall, this direction is approximately perpendicular to the surface, making it a reasonable surface normal for shading purposes.

The result (normal + magnitude) is stored in a `Storage3DTexture` (RGBA32F):

- **RGB**: normalised gradient direction
- **A**: gradient magnitude (boundary strength)

## GPU Gradient Computation

Computing central differences on the CPU for a 512x512x512 volume means ~134 million iterations on the main thread. Instead, a **WebGPU compute shader** does this in a single dispatched pass.

The compute shader assigns one thread per voxel via `instanceIndex`, decodes 3D coordinates from the linear index, reads neighbours with `textureLoad` (integer coordinates, no sampler), and writes results with `textureStore`:

```
For each voxel (x, y, z) in parallel:
  read 6 neighbours (clamped to volume bounds)
  compute central differences
  normalise gradient
  write (normal.xyz, magnitude) to storage texture
```

The gradient is computed once when a volume loads (using t=0 for 4D data) and reused for all time steps. This is a valid approximation for 4D flow MRI where vessel geometry is stable across the time dimension, but for cases where geometry significantly changes, this will be inaccurate.

- **`TODO:`** - cache/recompute surface normals for unstable geometry

## Blinn-Phong Lighting

The shading model is **Blinn-Phong** with a head-light: the light source is placed at the camera position, so the light direction L and view direction V are both equal to `-rayDir`.

This simplifies the halfway vector:

```
H = normalize(L + V) = normalize(-rayDir + -rayDir) = -rayDir
```

So the Blinn-Phong specular term collapses to:

```
diffuse  = max(dot(N, -rayDir), 0)
specular = diffuse ^ shininess          (since dot(N, H) = dot(N, -rayDir) = diffuse)
lighting = ambient + diffuse * 0.7 + specular * 0.1
```

Shininess is set to 32, giving a moderately tight highlight. Lower values (8-16) give softer, broader highlights; higher values (64+) give sharp, mirror-like ones.

### Why Blinn-Phong over Phong?

Phong specular uses the reflected light vector: `dot(reflect(-L, N), V)^shininess`. It has a known artefact where specular highlights suddenly disappear when the angle between the view direction and reflection direction > 90 because of the cosine in the dot product. Blinn-Phong avoids this because it takes the dot product of the surface normal and the *halfway vector* of the view direction and light direction: the angle will always be <90. It is also faster to compute (no `reflect()` needed) and generally more physically accurate.

## Gradient-Gated Shading

Applying lighting uniformly would darken flat regions (where the gradient is near zero and the normal is essentially noise). Instead, shading strength is gated by gradient magnitude:

```
shadingStrength = clamp(magnitude * 8.0, 0.0, 1.0)
blendedLighting = mix(1.0, lighting, shadingStrength)
shadedColor = transferFunctionColor * blendedLighting
```

- Where magnitude is near zero (homogeneous tissue, background): `shadingStrength = 0`, `blendedLighting = 1.0` — sample is fully unlit, no darkening
- Where magnitude is high (vessel walls, tissue boundaries): `shadingStrength = 1.0`, full Blinn-Phong lighting applies

The factor of 8.0 means the shading is fully active once the central-difference magnitude reaches 0.125 (an 12.5% intensity change across two voxels).

## Shading Toggle

Shading is controlled at runtime by a `shadingEnabled` uniform (0.0 or 1.0) without recompiling the shader:

```
finalColor = select(shadingEnabled > 0.5, shadedColor, transferFunctionColor)
```

When disabled, the raw transfer function colour is used. The toggle is exposed in the rendering controls panel.

## Coordinate Space

Both the gradient texture and `rayDir` are in the same texture/local space (normalised [0,1] per axis). No additional transform is needed when computing `dot(N, -rayDir)`.

Voxel spacing is not accounted for: gradients are computed in index space, not physical millimetre space. For anisotropic volumes (non-uniform voxel spacing), normals are biased toward the axis with finer resolution. This is acceptable for visualisation but would matter for quantitative surface analysis.

## Related Files

- `src/utils/gradientTexture.ts` - WebGPU compute shader for gradient computation
- `src/shaders/volumeRaymarch.ts` - Blinn-Phong lighting applied per sample
- `src/hooks/useVolumeSetup.ts` - Async gradient dispatch and material wiring
- `src/components/ui/RenderingControls.tsx` - Shading toggle UI
- `src/store/slices/renderingSlice.ts` - `shadingEnabled` state
