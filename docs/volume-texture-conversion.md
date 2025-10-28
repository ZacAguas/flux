# Volume Texture Conversion

This document explains how we convert NIfTI volume data to THREE.Data3DTexture for GPU-accelerated rendering.

## Why 3D Textures?

Medical imaging volumes are inherently 3D datasets (x, y, z voxels). We need a way to efficiently store and sample this data on the GPU for volume rendering. Three.js Data3DTexture provides:

1. **GPU-resident data**: Entire volume lives in GPU memory for fast access
2. **Hardware interpolation**: GPU performs trilinear interpolation automatically
3. **Efficient sampling**: Shaders can sample any 3D position in O(1) time
4. **Memory locality**: 3D texture layout optimized for spatial coherence

## The Rendering Pipeline

The texture converter sits between file parsing and rendering:

```
NIfTI File → Parser → Volume Data → Texture Converter → 3D Texture → Raymarching Shader
```

## Why Normalize Data?

NIfTI files contain raw intensity values that vary widely:
- **CT scans**: Hounsfield units (-1000 to +3000)
- **MRI**: Arbitrary intensity units (0 to 4095 or higher)
- **Different data types**: uint8, int16, float32, etc.

We normalize to [0, 1] because:

1. **Shader simplicity**: Shaders work with 0-1 range, avoiding per-scan scaling
2. **Transfer function consistency**: All volumes use same 0-1 input range
3. **Precision**: Float32 textures give us excellent precision across the range
4. **Hardware optimization**: GPUs are optimized for normalized texture coordinates

Original data range is preserved in metadata for:
- Display purposes (showing real HU values)
- Measurement tools
- Export functionality

## Texture Parameter Choices

### Format: RedFormat (Single Channel)

- Medical imaging is typically single-valued intensity per voxel
- Saves 4x memory vs RGBA (critical for large volumes)
- 256³ volume: 64MB vs 256MB
- Color mapping happens via transfer function in shader

### Type: FloatType (32-bit float)

- Preserves precision after normalization
- Avoids banding artifacts in gradients
- Required for accurate interpolation
- Trade-off: More memory than Uint8, but necessary for quality

### Filter: LinearFilter

- GPU performs trilinear interpolation automatically
- Smooth appearance when viewing at non-axis-aligned angles
- Essential for high-quality volume rendering
- Alternative (NearestFilter) would show blocky voxels

### Wrapping: ClampToEdgeWrapping

- Prevents sampling beyond volume boundaries
- When raymarching exits the volume, clamps to edge values
- Avoids visual artifacts from texture wrapping

## Memory Considerations

GPU memory is limited, especially on integrated graphics:

| Volume Size | Memory (Float32, single channel) |
|-------------|----------------------------------|
| 128³        | 8 MB                            |
| 256³        | 64 MB                           |
| 512³        | 512 MB                          |
| 1024³       | 4 GB                            |

### 4D Data Strategy

For 4D data (x, y, z, time):
- Load one time step at a time into texture
- Swap textures when user changes time step
- Consider texture pooling for smooth playback
- Potential future: Stream time steps on demand

## Future Optimizations

1. **Downsampling**: Generate lower-resolution versions for preview
2. **Bricking**: Split large volumes into manageable chunks
3. **Compression**: Use texture compression formats (requires preprocessing)
4. **Web Workers**: Move normalization off main thread for responsiveness
5. **Lazy loading**: Load only visible regions for very large datasets

## Related Files

- `src/utils/volumeTextureConverter.ts` - Implementation
- `src/types/nifti.ts` - Type definitions
- `src/utils/niftiParser.ts` - File parsing
