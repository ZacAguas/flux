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
    └─ CACHE MISS → Check generation lock
                    ├─ LOCKED → Skip (generation in progress)
                    └─ UNLOCKED → Acquire lock
                                  ↓
                                  Generate texture using buffer pool (~20-100ms, zero allocation)
                                  ↓
                                  Add to cache (LRU eviction if full)
                                  ↓
                                  Release lock
    ↓
Update material texture uniform (volumeTexture → shader)
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

### Chosen Approach: Window Loading with Progressive Cache

Cache up to 3 textures with **LRU eviction** (keeps most recently used)

**Benefits:**

1. **Progressive caching**: Once visited, time steps load instantly (<1ms)
2. **Reasonable memory**: Max 3 × texture size (typically 192-1536MB)
3. **Adaptive**: Auto-disables for large textures (>512MB)
4. **Zero allocation**: Buffer pooling eliminates garbage generation during playback

**Trade-offs:**

- First visit to each time step requires generation (20-50ms with buffer pooling)
- Cache warms up during playback rather than preloading
- 3× memory vs single-texture lazy loading (but within GPU limits)

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

## Progressive Cache Building (No Background Preloading)

**Background preloading is disabled** due to the singular buffer pool architecture. Here's why:

With buffer pooling for zero-allocation generation:
- Single `Float32Array` buffer shared across all texture generations
- Parallel preloading would require either:
  - Multiple buffers (defeats zero-allocation benefit, returns to memory pressure)
  - Complex buffer scheduling (risk of data corruption from concurrent writes)

**Current approach:**
- Cache builds progressively during normal playback
- When user navigates forward: step 0 → 1 → 2 → 3, cache grows naturally
- Generation is fast with buffer pooling (20-50ms, zero allocation)
- This is sufficient for typical use cases and maintains memory stability

**Future enhancement:**
- Web Worker with separate buffer could enable true parallel preloading
- Worker would have its own buffer pool, avoiding main thread contention
- Would improve cache warm-up for random access patterns

## Time Step Change Flow

### Initial Load (timeStep=0)

```
Load 4D NIfTI file
    ↓
parseNifti() extracts dimensions.t (e.g., 24 time steps)
    ↓
useVolumeSetup creates buffer pool (Float32Array, volumeSize bytes)
    ↓
createVolumeTexture(volume, 0, bufferPool) generates texture for first time step
    ↓
setVolume() stores volume + texture, resets timeStep to 0
    ↓
Console: "4D dataset: 24 time steps"
         "Single texture: 64.3 MB"
         "Window cache (3 textures): 192.9 MB"
         "Buffer pool created: 64.3 MB"
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
    └─ Not found → Check generation lock (isGeneratingRef)
                   ├─ LOCKED → Skip, log warning
                   └─ UNLOCKED → Acquire lock
                                 ↓
                                 extractTimeStep() slices data array
                                 ↓
                                 normalizeVolumeData(data, dataRange, bufferPool)
                                 ↓
                                 Create THREE.Data3DTexture (references bufferPool, zero allocation)
                                 ↓
                                 texture.needsUpdate = true (GPU copies from buffer pool)
                                 ↓
                                 setVolumeTexture(texture)
                                 ↓
                                 addTextureToCache(5, texture)
                                 ↓
                                 Release lock
    ↓
Material texture uniform update (updateVolumeTexture)
    ↓
Raymarching shader samples new texture
    ↓
Console: "Time step 5: 64.3 MB"
```

### Subsequent Navigation (5 → 6)

```
User increments to 6
    ↓
setTimeStep(6)
    ↓
textureCache.get(6) → MISS (cache builds progressively during playback)
    ↓
Generate texture using buffer pool [<1ms, zero allocation]
    ↓
setVolumeTexture(texture)
    ↓
addTextureToCache(6, texture)
    ↓
Material texture uniform update
    ↓
Console: "Time step 6: 64.3 MB"
```

**Note:** Cache is built progressively during normal playback (forward/backward navigation). Once a time step has been visited, subsequent access is instant (<1ms cache hit).

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

## Memory Allocation Problem and Buffer Pool Solution

### The Problem Discovered

During high-speed playback testing (30 FPS), the application crashed with `RangeError: Array buffer allocation failed`. Investigation revealed the root cause:

**Excessive garbage generation from temporary allocations:**

```typescript
function createVolumeTexture(volume, timeStep) {
  const data = extractTimeStep(...);

  // Problem: New 14MB Float32Array allocated every generation
  const normalized = new Float32Array(data.length); // 14MB
  for (let i = 0; i < data.length; i++) {
    normalized[i] = (data[i] - min) / (max - min);
  }

  const texture = new Data3DTexture(normalized, ...);
  texture.needsUpdate = true; // GPU copies data

  return texture;
  // normalized array becomes garbage (GPU has its own copy)
}
```

**At 30 FPS:**

- Generation time: 20-50ms per texture
- Frame interval: 33ms
- Result: 30 allocations/second = 420MB/second of garbage
- JavaScript GC runs every ~1-2 seconds
- **Crash:** New allocations happen faster than GC can free memory

**Failed approaches:**

1. Generation throttling - Limits max FPS, treats symptom not cause
2. Background preloading removal - Didn't solve main thread allocations
3. Generation lock alone - Prevents parallel allocations but not sequential pressure

### The Solution: Buffer Pooling

**Reuse a single Float32Array buffer** instead of allocating new ones:

```typescript
// Allocate once when volume loads
const bufferPool = new Float32Array(volumeSize); // 14MB, lives forever

function createVolumeTexture(volume, timeStep, bufferPool) {
  const data = extractTimeStep(...);

  // Normalise into reusable buffer (zero allocation!)
  normaliseInPlace(data, bufferPool);

  const texture = new Data3DTexture(bufferPool, ...);
  texture.needsUpdate = true; // GPU copies from pool

  return texture;
  // bufferPool persists for next generation
}
```

**Implementation details:**

1. **Buffer lifecycle:** Created when volume loads, released when volume unloads
2. **Generation lock:** Prevents concurrent writes to shared buffer
3. **GPU upload:** `texture.needsUpdate` synchronously copies buffer data, making it immediately safe to reuse
4. **Zero garbage:** After initial allocation, no temporary arrays created

### Results

**Before buffer pooling (30 FPS):**

- Garbage generation: 420MB/second
- Memory: Continuous growth until crash
- Max sustainable FPS: ~6 (with throttling)

**After buffer pooling (30 FPS):**

- Garbage generation: 0 MB/second (zero allocation)
- Memory: Stable, no growth
- Max sustainable FPS: Unlimited (tested at 30 FPS sustained)

### Why Background Preloading is Disabled

With a singular buffer pool, background preloading would require either:

- Multiple buffers (defeats zero-allocation benefit)
- Complex buffer scheduling (risk of data corruption)

Current approach builds cache progressively during normal playback, which is sufficient for typical use cases.

**Future enhancement:** Web Worker with separate buffer could enable true parallel preloading without memory pressure.

## Performance Characteristics

### Texture Generation Time (With Buffer Pooling)

| Volume Size | Generation Time | Memory Allocation | Notes                          |
|-------------|-----------------|-------------------|--------------------------------|
| 128³        | 5-10 ms         | 0 bytes           | Zero-allocation, imperceptible  |
| 256³        | 20-50 ms        | 0 bytes           | Zero-allocation, smooth         |
| 384³        | 60-100 ms       | 0 bytes           | Zero-allocation, acceptable     |
| 512³        | 150-200 ms      | 0 bytes           | Zero-allocation, caching disabled (texture size) |

**Factors:**

- CPU speed (data normalisation is CPU-bound)
- Memory bandwidth (typed array slicing and writing to buffer pool)
- GPU upload time (texture.needsUpdate)

**Buffer pooling impact:**

- **Zero garbage generation** after initial buffer allocation
- No allocation overhead or GC pauses during playback
- Sustainable 30 FPS playback tested and verified

### Cache Hit Performance

**Cache hit: <1ms** (instant)

- No texture generation
- Simple Map lookup + pointer assignment
- Material texture uniform update (~0.1ms, not full recreation)

**Why caching matters:**

- Playback at 30 FPS = 33ms per frame budget
- Without cache: 20-50ms generation leaves 13-33ms for rendering
- With cache: <1ms leaves 32ms for rendering (smoother)

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
// Buffer pool ref (created once per volume)
const bufferPoolRef = useRef<Float32Array | null>(null);
const isGeneratingRef = useRef<boolean>(false);

// Create buffer pool when volume loads
useEffect(() => {
  if (!volume) return;
  const volumeSize = volume.dimensions.x * volume.dimensions.y * volume.dimensions.z;
  bufferPoolRef.current = new Float32Array(volumeSize);
}, [volume]);

// Regenerate texture on time step change
useEffect(() => {
  if (!volume.dimensions.t || volume.dimensions.t <= 1) return;

  // Check cache
  const cached = textureCache.get(timeStep);
  if (cached) {
    setVolumeTexture(cached);
    return;
  }

  // Generation lock prevents concurrent buffer writes
  if (isGeneratingRef.current) return;
  isGeneratingRef.current = true;

  try {
    // Zero-allocation generation using buffer pool
    const texture = createVolumeTexture(volume, timeStep, bufferPoolRef.current);
    setVolumeTexture(texture);

    if (memoryMB <= 512) {
      addTextureToCache(timeStep, texture);
    }
  } finally {
    isGeneratingRef.current = false;
  }
}, [timeStep, volume, textureCache]);
```

**Key features:**

- Buffer pool created once, reused for all time steps
- Generation lock prevents data corruption from concurrent access
- Zero garbage generation after initial allocation
- Reactive: automatically triggers when `timeStep` changes

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
