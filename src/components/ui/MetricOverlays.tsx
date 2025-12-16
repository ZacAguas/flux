/**
 * Metric Overlays Component
 *
 * Displays diagnostic metrics on 2D slice views and 3D volume view.
 * - 2D Slices: Window Level, Window Width, slice position, thickness, orientation
 * - 3D Volume: Volume filename, rendering quality preset, transfer function preset
 */

import type { NiftiVolume } from '../../types/nifti';
import type { SliceIndices } from '../../types/layout';
import { useViewerStore } from '../../store/viewerStore';

type SliceOrientation = 'axial' | 'coronal' | 'sagittal';

interface MetricOverlaysProps {
  layoutMode: 'single' | 'quad' | 'slices';
  canvasWidth: number;
  canvasHeight: number;
  panelHeight: number;
}

// Helper: Calculate physical position from voxel index
function getSlicePhysicalPosition(
  orientation: SliceOrientation,
  sliceIndices: SliceIndices,
  volume: NiftiVolume
): number {
  const { dimensions, spacing } = volume;

  switch (orientation) {
    case 'axial':
      return (sliceIndices.axial - dimensions.z / 2) * spacing.z;
    case 'coronal':
      return (sliceIndices.coronal - dimensions.y / 2) * spacing.y;
    case 'sagittal':
      return (sliceIndices.sagittal - dimensions.x / 2) * spacing.x;
  }
}

// Helper: Get slice thickness from spacing
function getSliceThickness(
  orientation: SliceOrientation,
  volume: NiftiVolume
): number {
  switch (orientation) {
    case 'axial':
      return volume.spacing.z;
    case 'coronal':
      return volume.spacing.y;
    case 'sagittal':
      return volume.spacing.x;
  }
}

// Helper: Format numbers with fixed decimals
function formatNumber(value: number, decimals: number = 1): string {
  // For large numbers (>1000), round to integer
  if (Math.abs(value) > 1000) {
    return Math.round(value).toString();
  }
  return value.toFixed(decimals);
}

// Helper: Get orientation display name
function getOrientationName(orientation: SliceOrientation): string {
  return orientation.charAt(0).toUpperCase() + orientation.slice(1);
}

// Helper: Get quality preset display name
function getQualityDisplayName(preset: string): string {
  return preset.charAt(0).toUpperCase() + preset.slice(1);
}

export function MetricOverlays({ layoutMode, canvasWidth, canvasHeight }: MetricOverlaysProps) {
  const volume = useViewerStore((state) => state.volume);
  const volumeFileName = useViewerStore((state) => state.volumeFileName);
  const sliceIndices = useViewerStore((state) => state.sliceIndices);
  const windowLevel = useViewerStore((state) => state.windowLevel);
  const showMetricOverlays = useViewerStore((state) => state.showMetricOverlays);
  const raymarchSettings = useViewerStore((state) => state.raymarchSettings);
  const activeTransferFunctionPreset = useViewerStore((state) => state.activeTransferFunctionPreset);

  if (!showMetricOverlays || !volume) return null;

  const overlayStyle = {
    position: 'absolute' as const,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    padding: '6px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontFamily: 'monospace',
    lineHeight: '1.4',
    pointerEvents: 'none' as const,
    zIndex: 10,
    transition: 'top 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  };

  // Render 2D slice metrics
  const renderSliceMetrics = (orientation: SliceOrientation, left: number, bottom: number) => {
    const position = getSlicePhysicalPosition(orientation, sliceIndices, volume);
    const thickness = getSliceThickness(orientation, volume);
    const wl = formatNumber(windowLevel.center, 1);
    const ww = formatNumber(windowLevel.width, 1);

    return (
      <div
        key={orientation}
        style={{
          ...overlayStyle,
          left: `${left}px`,
          bottom: `${bottom}px`,
        }}
      >
        <div>WL: {wl}  WW: {ww}</div>
        <div>Slice: {formatNumber(position, 1)} mm</div>
        <div>Thickness: {formatNumber(thickness, 1)} mm</div>
        <div>{getOrientationName(orientation)}</div>
      </div>
    );
  };

  // Render 3D volume metrics
  const renderVolumeMetrics = (left: number, bottom: number) => {
    const fileName = volumeFileName || 'Unknown Volume';
    const quality = getQualityDisplayName(raymarchSettings.qualityPreset);
    const tfPreset = activeTransferFunctionPreset;

    return (
      <div
        key="volume"
        style={{
          ...overlayStyle,
          left: `${left}px`,
          bottom: `${bottom}px`,
        }}
      >
        <div>{fileName}</div>
        <div>Quality: {quality}</div>
        <div>TF: {tfPreset}</div>
      </div>
    );
  };

  // Layout-specific rendering
  if (layoutMode === 'quad') {
    const halfWidth = canvasWidth / 2;
    const halfHeight = canvasHeight / 2;

    return (
      <>
        {/* Axial (top-left) */}
        {renderSliceMetrics('axial', 10, halfHeight + 10)}

        {/* Coronal (top-right) */}
        {renderSliceMetrics('coronal', halfWidth + 10, halfHeight + 10)}

        {/* Sagittal (bottom-left) */}
        {renderSliceMetrics('sagittal', 10, 10)}

        {/* Volume (bottom-right) */}
        {renderVolumeMetrics(halfWidth + 10, 10)}
      </>
    );
  } else if (layoutMode === 'slices') {
    const thirdWidth = canvasWidth / 3;

    return (
      <>
        {/* Axial (left) */}
        {renderSliceMetrics('axial', 10, 10)}

        {/* Coronal (center) */}
        {renderSliceMetrics('coronal', thirdWidth + 10, 10)}

        {/* Sagittal (right) */}
        {renderSliceMetrics('sagittal', thirdWidth * 2 + 10, 10)}
      </>
    );
  } else if (layoutMode === 'single') {
    return (
      <>
        {/* Volume only */}
        {renderVolumeMetrics(10, 10)}
      </>
    );
  }

  return null;
}
