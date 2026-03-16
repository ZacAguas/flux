/**
 * TicOverlay Component
 *
 * SVG overlay rendering TIC ROI circles on slice viewports.
 * Follows the MeasurementOverlay pattern.
 */

import { useViewerStore } from '../../store/viewerStore';
import { getViewportBounds, voxelToPixel, type ViewportBounds } from '../../utils/sliceInteraction';
import type { SliceOrientation } from '../../types/layout';
import type { TicROI } from '../../types/tic';

interface TicOverlayProps {
  layoutMode: 'quad' | 'slices';
  canvasWidth: number;
  canvasHeight: number;
  panelHeight: number;
}

interface ViewportTicRoisProps {
  orientation: SliceOrientation;
  viewport: ViewportBounds;
  rois: TicROI[];
  currentSliceIndex: number;
  preview: {
    orientation: SliceOrientation;
    centerIndex1: number;
    centerIndex2: number;
    radiusVoxels: number;
  } | null;
}

function ViewportTicRois({
  orientation,
  viewport,
  rois,
  currentSliceIndex,
  preview,
}: ViewportTicRoisProps) {
  const volume = useViewerStore((state) => state.volume);
  const sliceCameraState = useViewerStore((state) => state.sliceCameraState);

  if (!volume) return null;

  const cameraState = sliceCameraState[orientation];

  // Filter ROIs for this orientation and current slice
  const visibleRois = rois.filter(
    (r) => r.orientation === orientation && r.sliceIndex === currentSliceIndex
  );

  const showPreview = preview !== null && preview.orientation === orientation;

  if (visibleRois.length === 0 && !showPreview) return null;

  /**
   * Convert a ROI center + radius (voxel space) to pixel circle params.
   * Uses voxelToPixel for center, then offsets index1 by radius to get pixel radius.
   */
  function roiToPixelCircle(
    centerIndex1: number,
    centerIndex2: number,
    radiusVoxels: number
  ): { cx: number; cy: number; r: number } | null {
    const centerPx = voxelToPixel(
      { index1: centerIndex1, index2: centerIndex2 },
      orientation,
      volume!,
      viewport,
      cameraState
    );
    const edgePx = voxelToPixel(
      { index1: centerIndex1 + radiusVoxels, index2: centerIndex2 },
      orientation,
      volume!,
      viewport,
      cameraState
    );
    const cx = centerPx.x - viewport.x;
    const cy = centerPx.y - viewport.y;
    const r = Math.abs(edgePx.x - centerPx.x);
    if (r < 1) return null;
    return { cx, cy, r };
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: `${viewport.x}px`,
        top: `${viewport.y}px`,
        width: `${viewport.width}px`,
        height: `${viewport.height}px`,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 3,
      }}
    >
      <svg
        width={viewport.width}
        height={viewport.height}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        {/* Completed ROI circles */}
        {visibleRois.map((roi) => {
          const circle = roiToPixelCircle(roi.centerIndex1, roi.centerIndex2, roi.radiusVoxels);
          if (!circle) return null;
          return (
            <g key={roi.id}>
              <circle
                cx={circle.cx}
                cy={circle.cy}
                r={circle.r}
                fill="none"
                stroke={roi.color}
                strokeWidth={1.5}
                strokeOpacity={0.9}
              />
              <circle
                cx={circle.cx}
                cy={circle.cy}
                r={2.5}
                fill={roi.color}
                fillOpacity={0.9}
              />
              {/* Label */}
              <text
                x={circle.cx + circle.r + 4}
                y={circle.cy}
                fill={roi.color}
                fontSize={10}
                dominantBaseline="central"
                fontFamily="monospace"
                fontWeight={500}
              >
                {roi.label}
              </text>
            </g>
          );
        })}

        {/* In-progress drag preview */}
        {showPreview && preview.radiusVoxels >= 1 && (() => {
          const circle = roiToPixelCircle(
            preview.centerIndex1,
            preview.centerIndex2,
            preview.radiusVoxels
          );
          if (!circle) return null;
          return (
            <circle
              cx={circle.cx}
              cy={circle.cy}
              r={circle.r}
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth={1.5}
              strokeDasharray="5,4"
            />
          );
        })()}
      </svg>
    </div>
  );
}

export function TicOverlay({
  layoutMode,
  canvasWidth,
  canvasHeight,
  panelHeight,
}: TicOverlayProps) {
  const volume = useViewerStore((state) => state.volume);
  const ticRois = useViewerStore((state) => state.ticRois);
  const ticDragPreview = useViewerStore((state) => state.ticDragPreview);
  const sliceIndices = useViewerStore((state) => state.sliceIndices);

  if (!volume) return null;
  if (ticRois.length === 0 && ticDragPreview === null) return null;

  const orientations: SliceOrientation[] = ['axial', 'coronal', 'sagittal'];

  return (
    <>
      {orientations.map((orientation) => (
        <ViewportTicRois
          key={orientation}
          orientation={orientation}
          viewport={getViewportBounds(layoutMode, orientation, canvasWidth, canvasHeight, panelHeight)}
          rois={ticRois}
          currentSliceIndex={sliceIndices[orientation]}
          preview={ticDragPreview}
        />
      ))}
    </>
  );
}
