# Multi-Viewport Rendering Implementation

This document explains the approaches attempted to implement quad-view layout (4 synchronized viewports in a 2x2 grid) and the solution that worked.

## Goal

Display four viewports:

- **Top-left**: Axial slice (XY plane)
- **Top-right**: Coronal slice (XZ plane)
- **Bottom-left**: Sagittal slice (YZ plane)
- **Bottom-right**: 3D volume rendering

All views must share the same volume texture (no duplication).

## Approach A: Multiple Canvas with CanvasTarget (FAILED)

### Concept

Use ONE WebGPURenderer with multiple canvas elements, leveraging the CanvasTarget API (Three.js r181+).

### Implementation Pattern

```typescript
// Create shared renderer with primary canvas
const renderer = new THREE.WebGPURenderer({ canvas: volumeCanvas });
await renderer.init();

// Create CanvasTarget for additional canvases
const axialTarget = new THREE.CanvasTarget(axialCanvas);
const coronalTarget = new THREE.CanvasTarget(coronalCanvas);
const sagittalTarget = new THREE.CanvasTarget(sagittalCanvas);

// Render to specific targets
renderer.setRenderTarget(axialTarget);
renderer.render(axialScene, axialCamera);
renderer.setRenderTarget(null); // Reset to primary canvas
```

### Why it Failed

1. **React Three Fiber (R3F) conflict**: R3F's `<Canvas>` component creates its own canvas element, we were creating manual `<canvas>` elements too
2. **Duplicate canvases**: Both manual `<canvas>` elements AND R3F `<Canvas>` components rendered, causing overlapping
3. **Layout issues**: Duplicate canvases caused scrolling and positioning problems
4. **Complexity**: Integrating CanvasTarget with R3F's automatic render loop proved too complex

### Reference

Based on Three.js `webgpu_multiple_canvas.html` example

---

## Approach B: Single Canvas with Viewports (SUCCEEDED)

### Concept

ONE Canvas with manual viewport/scissor rendering to divide it into 4 quadrants.

**What is viewport/scissor rendering?**
- **Viewport**: Defines which region of the canvas to render to (position and size)
- **Scissor test**: Clips rendering to stay within the viewport bounds, preventing one view from drawing into another's region
- Together they allow rendering different content to different rectangular regions of a single canvas

### Implementation

```typescript
function ViewportRenderer() {
  const { gl, size } = useThree();

  // Create 4 separate scenes and cameras
  const axialScene = new THREE.Scene();
  const coronalScene = new THREE.Scene();
  const sagittalScene = new THREE.Scene();
  const volumeScene = new THREE.Scene();
  // ... cameras, materials, meshes

  useFrame(() => {
    const halfWidth = size.width / 2;
    const halfHeight = size.height / 2;

    gl.clear(true, true, true);

    // Render to each quadrant
    gl.setViewport(0, 0, halfWidth, halfHeight);
    gl.setScissor(0, 0, halfWidth, halfHeight);
    gl.setScissorTest(true);
    gl.render(axialScene, axialCamera);

    gl.setViewport(halfWidth, 0, halfWidth, halfHeight);
    gl.setScissor(halfWidth, 0, halfWidth, halfHeight);
    gl.render(coronalScene, coronalCamera);

    gl.setViewport(0, halfHeight, halfWidth, halfHeight);
    gl.setScissor(0, halfHeight, halfWidth, halfHeight);
    gl.render(sagittalScene, sagittalCamera);

    gl.setViewport(halfWidth, halfHeight, halfWidth, halfHeight);
    gl.setScissor(halfWidth, halfHeight, halfWidth, halfHeight);
    gl.render(volumeScene, volumeCamera);

    gl.setScissorTest(false);
  }, 1);
}
```

### Why it Succeeded

1. **Simple integration**: Works naturally with R3F's architecture
2. **Single renderer**: Guaranteed texture sharing
3. **Manual control**: Full control over rendering to each viewport
4. **One canvas**: No duplicate elements or layout conflicts

### Reference

Based on Three.js `webgpu_multiple_elements.html` example

---

## Critical Discovery: WebGPU Viewport Coordinates

### The Bug

Initially, all viewports rendered to the wrong positions:

- 3D volume appeared in top-right instead of bottom-right
- All other views were similarly misplaced

### Debugging Approach

Added distinct background colors to each scene:

```typescript
axialScene.background = new THREE.Color(0x330000);   // Dark red
coronalScene.background = new THREE.Color(0x003300); // Dark green
sagittalScene.background = new THREE.Color(0x000033); // Dark blue
volumeScene.background = new THREE.Color(0x333300);  // Dark yellow
```

Observed which color appeared in which quadrant to identify the coordinate mismatch.

### Root Cause

**WebGPU viewport coordinate system differs from WebGL:**

- **WebGL**: `Y=0` is at **bottom** of canvas, Y increases upward
- **WebGPU**: `Y=0` is at **top** of canvas, Y increases downward

### The Fix

Inverted Y coordinates in viewport calls:

```typescript
// WRONG (WebGL-style):
gl.setViewport(0, halfHeight, ...);  // Bottom-left in WebGL, but top-left in WebGPU

// CORRECT (WebGPU-style):
gl.setViewport(0, 0, ...);           // Top-left in WebGPU
```

**Final viewport mapping:**

```typescript
// Top-left (Axial)
gl.setViewport(0, 0, halfWidth, halfHeight);

// Top-right (Coronal)
gl.setViewport(halfWidth, 0, halfWidth, halfHeight);

// Bottom-left (Sagittal)
gl.setViewport(0, halfHeight, halfWidth, halfHeight);

// Bottom-right (Volume)
gl.setViewport(halfWidth, halfHeight, halfWidth, halfHeight);
```
