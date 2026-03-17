# Time Intensity Curves (TIC)

This document describes the TIC analysis feature: how it works, its architecture, and the data flow from ROI placement to chart rendering.

## Concept

A **Time Intensity Curve** is a standard analysis tool in dynamic contrast-enhanced (DCE) imaging (e.g. perfusion MRI, dynamic CT). It plots the mean voxel intensity inside a region of interest (ROI) across every time step in a 4D volume. The resulting curve characterises how signal evolves over time at a specific anatomical location. For example, the wash-in and wash-out of a contrast agent through a vessel or tumour.

TIC analysis is only meaningful for 4D volumes (i.e. volumes with `dimensions.t > 1`). The section is hidden automatically for 3D data.

## Architecture

### Types (`src/types/tic.ts`)

```typescript
interface TicROI {
  id: string;
  label: string;           // "ROI 1", "ROI 2", etc.
  color: string;
  orientation: SliceOrientation;
  sliceIndex: number;      // Depth voxel index where the ROI was placed
  centerIndex1: number;    // In-plane coord 1 (x for axial/coronal, y for sagittal)
  centerIndex2: number;    // In-plane coord 2 (y for axial, z for coronal/sagittal)
  radiusVoxels: number;    // Radius in in-plane voxel units
  createdAt: number;
}

interface TicCurve {
  roiId: string;
  intensities: number[];   // Mean voxel intensity per time step, raw (no normalisation)
  timeAxis: number[];      // In seconds if TR is available, else 0-based step index
}
```

ROI coordinates are stored in **voxel space**, not millimetres. This keeps them independent of voxel spacing and makes them stable across resampled volumes.

### State (`src/store/slices/ticSlice.ts`)

`TicSlice` is composed into the main Zustand store alongside all other slices. It holds:

- `ticRois: TicROI[]` — ordered list of placed ROIs.
- `ticCurves: Record<string, TicCurve>` — keyed by ROI id; computed on ROI creation, not stored in sessions.
- `ticToolActive: boolean` — whether the drag-to-place tool is active.
- `ticDragPreview: TicDragPreview | null` — in-progress drag state used by the overlay to render the dashed preview circle.

### Extraction (`src/utils/ticExtractor.ts`)

`extractTicCurve(volume, roi)` is a pure CPU function that:

1. Computes a tight bounding box around the ROI center in in-plane voxel space.
2. Iterates every voxel in the box, applying a **circular mask** (`d1² + d2² <= r²`).
3. For each time step `t`, accumulates raw intensities from the flat `volume.data` array using:

   ```
   offset = x + y*dimX + z*dimX*dimY + t*dimX*dimY*dimZ
   ```

4. Returns the mean intensity per time step, and a time axis in seconds (using `spacing.t` / TR if available) or step index otherwise.

The coordinate mapping by orientation is:

| Orientation | depth (sliceIndex) | index1 | index2 |
|-------------|-------------------|--------|--------|
| Axial       | z                 | x      | y      |
| Coronal     | y                 | x      | z      |
| Sagittal    | x                 | y      | z      |

**Performance:** Extraction is O(T × πr²). For a 5-voxel radius on a 100-step volume, this is roughly 8,000 memory accesses — negligible on the main thread. No Web Worker is needed.

**Why not a compute shader:** Only the current time step's 3D texture is on the GPU. Uploading the full 4D dataset as a GPU buffer plus an async readback round-trip would be slower than CPU extraction for this workload.

### Interaction (`src/components/ui/SliceInteractionHandler.tsx`)

TIC tool adds a `'tic'` interaction mode to the existing mode union. When `ticToolActive` is set:

- **Pointer down:** `pixelToVoxel()` converts the cursor position to voxel indices, storing the center in a ref.
- **Pointer move:** The current cursor position is converted to voxels; `radiusVoxels = sqrt(d1² + d2²)` is computed and pushed to `setTicDragPreview()`, driving the overlay preview in real time.
- **Pointer up:** If `radiusVoxels >= 1`, a `TicROI` is constructed, `extractTicCurve()` is called synchronously, and `addTicRoi(roi, curve)` commits both to the store. The preview is cleared.

The tool stays active after each ROI so the user can place multiple ROIs without re-clicking the button, consistent with the measurement tool pattern.

### Overlay (`src/components/overlays/TicOverlay.tsx`)

Follows the `MeasurementOverlay` pattern: an absolute-positioned SVG container clipped to each slice viewport. Mounted inside both `SlicesOverlays` and `QuadOverlays` in `LayoutOverlays.tsx`.

For each visible ROI on the current orientation and slice index, it renders:

- A filled circle at the center (2.5px radius, ROI color).
- A stroked circle at `radiusVoxels` (converted to pixels via `voxelToPixel(center)` and `voxelToPixel(center + radius)`).
- A text label (`roi.label`) to the right of the circle.

During a drag, a dashed white circle shows the in-progress preview.

**Pixel radius derivation:** Rather than deriving a scale factor analytically, the overlay calls `voxelToPixel` twice — once for the center and once for a point displaced by `radiusVoxels` in the index1 direction — and takes the pixel distance between them. This automatically accounts for zoom, pan, and non-square voxels.

### Chart (`src/components/ui/TICChart.tsx`)

Uses `@visx/shape` (`LinePath`), `@visx/scale` (`scaleLinear`), and `@visx/axis` (`AxisBottom`, `AxisLeft`). Width is tracked via `ResizeObserver` so the chart fills its container responsively. Height is fixed at 180px.

The Y-axis shows raw voxel intensity with no unit label, which is standard practice for modality-agnostic viewers (MRI intensity is in arbitrary units; CT would be HU, but the NIfTI header does not mandate a unit string for the time series). A per-ROI legend below the chart maps colors to labels.

### Controls (`src/components/ui/TICControls.tsx`)

Rendered inside a `CollapsibleSection` (id: `ticCurves`) in `ControlPanel.tsx`. The section is only mounted when `is4D` is true. Contains:

- A "Place ROI" toggle button.
- A scrollable ROI list with per-ROI delete buttons.
- The TICChart, shown only when at least one ROI exists.

## Session Persistence

`ticRois` are serialised into `SerializableViewerState` alongside measurements. **Curves are not serialised**: they are recomputed from `volume.data` during `deserializeViewerState`, once the volume is loaded. If the volume is not yet loaded at restore time, ROIs are stored with empty curves and will not render a chart until the volume is available.

## Colour Palette

ROIs cycle through 8 distinct colors defined in `TIC_ROI_COLORS` (`src/types/tic.ts`). Colours are assigned by index at the time of ROI creation (`ticRois.length % 8`), so deleting a ROI and adding a new one may reuse a colour.
