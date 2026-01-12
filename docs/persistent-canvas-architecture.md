# Persistent Canvas Architecture

This document details the refactor to fix WebGPU crashes and improve layout switching performance, moving from a multi-canvas approach to a robust persistent canvas architecture.

## The Problem

### Symptoms

When switching between viewer layouts (e.g., from "Quad View" to "Single View"), the application would frequently crash with WebGPU errors:

* `Invalid scissor rect dimensions`
* `Depth stencil attachment size mismatches`

### Root Cause

The original architecture destroyed and recreated the entire React Three Fiber `<Canvas>` and the underlying `WebGPURenderer` every time the layout changed:

```tsx
// OLD Architecture
{mode === 'single' && <LayoutSingle />} // Contains its own <Canvas>
{mode === 'quad' && <LayoutQuad />}     // Contains its own <Canvas>
```

This "Mount/Unmount" cycle caused:

1. **Race Conditions:** The new renderer would try to apply scissor tests before the resizing logic had propagated, leading to invalid dimensions.
2. **Performance Hits:** Recompiling shaders and re-uploading textures on every switch.
3. **State Loss:** Camera positions and interaction states had to be manually synced or were lost.

## The Initial Idea (Rejected)

**Proposal:** Move all `THREE.Scene` and `THREE.Camera` objects into the global Zustand Store (`viewerStore.ts`).

**Why it was rejected:**

* **Anti-Pattern:** Storing complex, mutable objects (like Scenes) in an immutable state manager (Zustand) fights against React's design.
* **De-sync Risk:** It creates "Two Sources of Truth"—the Store vs. the Render Graph.
* **Performance:** Unnecessary re-renders if the store updates on every frame.

## The Final Architecture: "Component Hoisting"

Adopted a **Persistent Canvas** pattern using standard React Composition. The Canvas is created once at the root and never unmounts. We simply swap the *contents* (Render Loop) and the *Overlays* (UI).

### Core Components

**1. `PersistentLayout.tsx` (The Container)**
The permanent wrapper that holds the `<Canvas>`. It ensures the WebGPU Context stays alive for the session's duration.

**2. `SceneResources` (The Resource Manager)**
Located *inside* the Canvas. It initialises scenes and cameras **once** by calling the setup hooks (`useVolumeSetup`, `useSliceViews`). It passes these persistent objects down to the active renderer as props.

**3. `LayoutRenderers.tsx` (The Logic)**
Pure components (`SingleRenderer`, `QuadRenderer`) that receive scenes as props. They contain the specific `useFrame` logic for that view mode.

* **Switching is instant** because we just change which `useFrame` loop is running.

**4. `LayoutContext.tsx` (The Bridge)**
A lightweight React Context used to share DOM References between the UI layer and the Canvas layer.

* *Use Case:* The Quad View's `OrbitControls` (inside Canvas) need to attach to a specific `<div>` (in the Overlay), which standard props can't easily handle across the tree.

### Diagram

```
App (Root)
 └─ LayoutContextProvider (Shared References)
     └─ PersistentLayout (Container)
         │
         ├─ Canvas (WebGPU - Persistent)
         │   └─ SceneResources (Resource Manager)
         │       │  • Creates Scenes/Cameras ONCE
         │       └─ ActiveRenderer (Logic Switcher)
         │           │  • Switches useFrame loop
         │           ├─ SingleRenderer
         │           ├─ SlicesRenderer
         │           └─ QuadRenderer
         │
         └─ LayoutOverlays (UI - Switches HTML/CSS)
             ├─ SingleOverlays
             ├─ SlicesOverlays
             └─ QuadOverlays
```

## Benefits Analysis

The new architecture offers significant performance improvements by eliminating expensive re-initialisation steps.

| Aspect | **Previous Architecture** (`LayoutManager`) | **New Architecture** (`ActiveRenderer`) |
| :--- | :--- | :--- |
| **Canvas** | **Destroyed & Recreated** (Heavy) | **Persists** (Zero Cost) |
| **WebGPU Context** | **Lost & Re-initialised** (Very Heavy) | **Persists** (Zero Cost) |
| **Textures/Buffers** | **Re-uploaded to GPU** (Heavy) | **Stay in VRAM** (Zero Cost) |
| **Shaders** | **Recompiled** (Heavy) | **Stay Compiled** (Zero Cost) |
| **React Component** | Mounts `LayoutSlices` | Mounts `SlicesRenderer` |

## Key Fixes & Learnings

### The "Sticky Viewport" Bug

**Issue:** Switching from Quad (4 viewports) to Single (1 viewport) resulted in the Volume View being stuck in the bottom-right corner.
**Cause:** `gl.setViewport` and `gl.setScissor` settings persist on the WebGL/WebGPU context. The `SingleRenderer` assumed a clean state.
**Fix:** Added a `useEffect` in `SingleRenderer` to explicitly reset the viewport to full-screen on mount/resize.

```typescript
// SingleRenderer.tsx
useEffect(() => {
  gl.setViewport(0, 0, size.width, size.height);
  gl.setScissorTest(false);
}, [gl, size]);
```

## Summary

This refactor moved the application from a brittle "Recreate Everything" approach to a robust "Persistent State" architecture. It eliminated the WebGPU crashes and significantly improved the user experience during layout transitions.
