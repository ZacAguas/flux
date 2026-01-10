# 4D Temporal Navigation

This document explains the implementation of 4D NIfTI support, enabling navigation through time-series medical imaging data (e.g., blood flow dynamics, cardiac cycles, functional MRI).

## What is 4D Medical Imaging?

4D medical imaging adds a time dimension to standard 3D volumetric scans:

- **3D Volume**: `(x, y, z)` - Spatial dimensions
- **4D Volume**: `(x, y, z, t)` - Spatial dimensions + time

**Common use cases:**

- **Cardiac MRI**: Heart motion across cardiac cycle
- **fMRI**: Brain activity over time
- **Perfusion imaging**: Blood flow through vessels
- **Dynamic contrast-enhanced scans**: Contrast agent distribution

## Architecture Overview

The 4D implementation uses a **window loading with cache** strategy that balances memory efficiency with user experience.

```
User changes timeStep
    ↓
Check texture cache (Map<timeStep, texture>)
    ├─ CACHE HIT → Use cached texture (instant, <1ms)
    └─ CACHE MISS → Generate new texture (~20-100ms)
                    ↓
                    Add to cache (LRU eviction if full)
                    ↓
                    Background preload adjacent time steps
    ↓
Material auto-recreates (volumeTexture dependency)
    ↓
Render updated time step
```

## Why Window Loading?

### Rejected Approaches

**Approach A: Lazy Loading (single texture)**

- **Pro**: Minimal memory (1 texture = 64-512MB)
- **Con**: Noticeable latency on every time step change (20-100ms)
- **Verdict**: Poor UX for playback animation

**Approach B: Preload All Time Steps**

- **Pro**: Instant navigation (cached)
- **Con**: Massive memory usage (24 time steps × 512MB = 12GB)
- **Verdict**: Exceeds GPU memory limits on most devices

### Chosen Approach: Window Loading

Cache 3 textures: **current + next + previous**

**Benefits:**

1. **Instant sequential navigation**: Forward/backward playback is cached (<1ms)
2. **Reasonable memory**: 3 × texture size (typically 192-1536MB)
3. **Adaptive**: Auto-disables for large textures (>512MB)

**Trade-offs:**

- Random jumps still require generation (acceptable, less common)
- 3× memory vs lazy loading (but within GPU limits)

## Memory Management

### Texture Cache (Map-based)

```typescript
textureCache: Map<number, THREE.Data3DTexture>
```

**LRU Eviction Strategy:**

- Max cache size: 3 textures
- When full, evict texture **furthest** from current timeStep
- Example: timeStep=5, cache has [4, 5, 6], user jumps to 10
  - Evict texture 4 (distance=6, furthest from 10)
  - Cache becomes [5, 6, 10]

**Disposal Safety:**

- Explicit `texture.dispose()` on eviction
- Cache cleared when loading new volume
- Textures not in cache can be safely disposed via `setVolumeTexture()`

### Memory Thresholds

```typescript
if (memoryMB > 512) {
  console.warn('Large texture. Window loading disabled.');
  // Falls back to lazy loading (no cache)
}
```

**Typical Memory Usage:**

| Volume Size | Single Texture | Window Cache (3×) | Strategy        |
|-------------|----------------|-------------------|-----------------|
| 128³        | 8 MB           | 24 MB             | Cached          |
| 256³        | 64 MB          | 192 MB            | Cached          |
| 384³        | 226 MB         | 678 MB            | Cached          |
| 512³        | 512 MB         | 1536 MB           | Lazy (fallback) |

## Background Preloading

After loading current texture, adjacent time steps preload in background:

```typescript
setTimeout(() => {
  if (timeStep > 0) preload(timeStep - 1);
  if (timeStep < totalSteps - 1) preload(timeStep + 1);
}, 100); // 100ms delay to avoid blocking main texture
```

**Why 100ms delay?**

- Ensures current texture completes first (priority)
- Prevents stuttering during rapid slider changes
- Non-blocking: user can continue interacting

**Cache Check:**

```typescript
if (!textureCache.has(step)) {
  const texture = createVolumeTexture(volume, step);
  addTextureToCache(step, texture);
}
```

Avoids redundant generation if texture already cached.

## Time Step Change Flow

### Initial Load (timeStep=0)

```
Load 4D NIfTI file
    ↓
parseNifti() extracts dimensions.t (e.g., 24 time steps)
    ↓
createVolumeTexture(volume, 0) generates texture for first time step
    ↓
setVolume() stores volume + texture, resets timeStep to 0
    ↓
Console: "4D dataset: 24 time steps"
         "Single texture: 64.3 MB"
         "Window cache: 192.9 MB"
```

### User Changes Time Step (e.g., 0 → 5)

```
User drags slider to 5
    ↓
setTimeStep(5) with clamping validation
    ↓
useVolumeSetup detects timeStep change
    ↓
Check textureCache.get(5)
    ├─ Found → setVolumeTexture(cached) [instant]
    └─ Not found → Generate texture
                   ↓
                   createVolumeTexture(volume, 5)
                   ↓
                   extractTimeStep() slices data array
                   ↓
                   normalizeVolumeData()
                   ↓
                   Create THREE.Data3DTexture
                   ↓
                   addTextureToCache(5, texture)
                   ↓
                   Background preload: [4, 6]
    ↓
Material recreation (volumeTexture dependency)
    ↓
Raymarching shader samples new texture
    ↓
Console: "Time step 5: Generated texture (64.3 MB)"
         "Preloaded time step 4"
         "Preloaded time step 6"
```

### Subsequent Navigation (5 → 6)

```
User increments to 6
    ↓
setTimeStep(6)
    ↓
textureCache.get(6) → HIT (preloaded in background)
    ↓
setVolumeTexture(cached) [<1ms, instant]
    ↓
Console: "Time step 6: Using cached texture"
```

## Playback Controls

### Animation Loop

```typescript
setInterval(() => {
  const nextStep = timeStep + 1;

  if (nextStep >= totalTimeSteps) {
    if (loop) {
      setTimeStep(0); // Loop back
    } else {
      setIsPlaying(false); // Stop
    }
  } else {
    setTimeStep(nextStep);
  }
}, 1000 / fps);
```

**FPS Slider:** 1-30 frames per second

- 1 FPS: Slow examination
- 5 FPS: Default (smooth, manageable)
- 30 FPS: Fast playback (tests cache efficiency)

### Auto-Pause on Slow Loading

```typescript
if (isLoadingTimeStep && isPlaying) {
  setTimeout(() => {
    if (still loading) setIsPlaying(false);
  }, 500);
}
```

Prevents playback from getting ahead of texture generation on slow devices.

## Performance Characteristics

### Texture Generation Time

| Volume Size | Generation Time | Notes                          |
|-------------|-----------------|--------------------------------|
| 128³        | 5-10 ms         | Imperceptible                  |
| 256³        | 20-50 ms        | Slight delay, acceptable       |
| 384³        | 60-100 ms       | Noticeable but smooth with cache |
| 512³        | 150-200 ms      | Lazy loading only (no cache)   |

**Factors:**

- CPU speed (data normalisation is CPU-bound)
- Memory bandwidth (typed array slicing)
- GPU upload time (texture.needsUpdate)

### Cache Hit Performance

**Cache hit: <1ms** (instant)

- No texture generation
- Simple Map lookup + pointer assignment
- Material recreation still happens (~5ms)

**Why caching matters:**

- Playback at 5 FPS = 200ms per frame budget
- Without cache: 50ms generation leaves 150ms for rendering
- With cache: <1ms leaves 199ms for rendering (smoother)

## Console Logging Strategy

### File Load

```
4D dataset: 24 time steps
Single texture: 64.3 MB
Window cache (3 textures): 192.9 MB
```

**Purpose:** Inform user about memory requirements upfront.

### Time Step Change

```
Time step 5: Generated texture (64.3 MB)
Preloaded time step 4
Preloaded time step 6
```

OR

```
Time step 6: Using cached texture
```

**Purpose:** Debug performance, verify caching behaviour.

### Memory Warnings

```
Large texture (512.3 MB). Window loading disabled for memory safety.
```

**Purpose:** Explain fallback to lazy loading for large volumes.

## Implementation Details

### Store Infrastructure (viewerStore.ts)

```typescript
interface ViewerStore {
  timeStep: number;                                // Current time step
  isLoadingTimeStep: boolean;                      // Loading indicator
  textureCache: Map<number, THREE.Data3DTexture>;  // LRU cache

  setTimeStep: (step: number) => void;             // With clamping
  setVolumeTexture: (texture: Data3DTexture) => void; // Texture-only update
  addTextureToCache: (step: number, texture: Data3DTexture) => void;
  clearTextureCache: () => void;
}
```

### Texture Regeneration (useVolumeSetup.ts)

```typescript
useEffect(() => {
  if (!volume.dimensions.t || volume.dimensions.t <= 1) return;

  const cached = textureCache.get(timeStep);
  if (cached) {
    setVolumeTexture(cached);
    return;
  }

  const texture = createVolumeTexture(volume, timeStep);
  setVolumeTexture(texture);

  if (memoryMB <= 512) {
    addTextureToCache(timeStep, texture);
    // Background preload adjacent steps
  }
}, [timeStep, volume, textureCache]);
```

Reactive: automatically triggers when `timeStep` changes.

### UI Components

**TimeStepControls.tsx:**

- Slider for manual navigation
- Display: "5 / 23" (current / max)
- Loading spinner when `isLoadingTimeStep=true`
- Only renders if `volume.dimensions.t > 1`

**TimePlaybackControls.tsx:**

- Play/Pause button
- Loop toggle
- Reset to start
- FPS slider (1-30)
- Auto-pause on slow loading

## Future Enhancements

### Larger Cache Sizes

Current: 3 textures (current + 1 adjacent on each side)

**Possible:**

- 5 textures (current + 2 on each side)
- Configurable cache size based on available GPU memory
- Adaptive: larger cache for small textures

### Web Worker Background Generation

Move `extractTimeStep()` + `normalizeVolumeData()` to Web Worker:

```
Main Thread                Worker Thread
    |                           |
    | --- Generate step 4 ----> |
    |                           | extractTimeStep()
    |                           | normalizeVolumeData()
    | <---- Float32Array -----  |
    |                           |
Create texture on main thread
```

**Benefits:**

- Non-blocking texture generation
- Smoother UI during playback
- Faster preloading

**Trade-offs:**

- Added complexity (worker management)
- Memory copy overhead (structured clone)

### Time Series Visualisation

Plot intensity over time at cursor position:

```
User clicks voxel (x, y, z)
    ↓
Sample all time steps at that position
    ↓
Plot line graph: intensity vs time
```

**Use cases:**

- fMRI: visualise BOLD signal at specific brain region
- Perfusion: see contrast enhancement curve

## Related Files

- `src/store/viewerStore.ts` - State management (textureCache, timeStep)
- `src/hooks/useVolumeSetup.ts` - Texture regeneration and caching
- `src/components/ui/TimeStepControls.tsx` - Time slider UI
- `src/components/ui/TimePlaybackControls.tsx` - Playback controls
- `src/utils/volumeTextureConverter.ts` - Texture creation (extractTimeStep)
