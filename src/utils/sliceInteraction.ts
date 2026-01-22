/**
 * Slice Interaction and Coordinate Transformation Utilities
 *
 * Handles forward and backward coordinate transformations between pixel space and voxel indices for 2D slice views
 *
 * Forward transformation: Voxel indices -> World space -> NDC -> Pixel coordinates
 * Reverse transformation: Pixel coordinates -> NDC -> World space -> Voxel indices
 */

import type { NiftiVolume } from '../types/nifti';
import type { SliceIndices, SliceCamera, SliceOrientation } from '../types/layout';
import { getSliceDimensions } from './layout';

export interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CrosshairPosition {
  horizontal: number; // Y pixel position for horizontal line
  vertical: number; // X pixel position for vertical line
}

export interface CameraFrustum {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface WorldPosition {
  x: number;
  y: number;
}

export interface PixelPosition {
  x: number;
  y: number;
}

export interface InPlaneVoxelIndices {
  index1: number;
  index2: number;
}

interface VoxelIndicesWithOrientation extends InPlaneVoxelIndices {
  orientation1: keyof SliceIndices;
  orientation2: keyof SliceIndices;
}

// Low-level coordinate transformation functions

/**
 * Calculate camera frustum bounds for orthographic camera
 * Used by both forward and reverse coordinate transformations
 */
export function calculateCameraFrustum(
  volume: NiftiVolume,
  orientation: SliceOrientation,
  viewport: ViewportBounds,
  zoom: number = 1.0,
  panX: number = 0,
  panY: number = 0
): CameraFrustum {
  const sliceDims = getSliceDimensions(volume, orientation);

  // Calculate camera frustum (matching useSliceViews camera setup logic)
  const viewportAspect = viewport.width / viewport.height;
  const sliceAspect = sliceDims.width / sliceDims.height;
  const isHorizontal = sliceAspect > viewportAspect;

  const baseZoomFactor = isHorizontal
    ? sliceDims.width / 2
    : (sliceDims.height / 2) * viewportAspect;

  // Apply user zoom (smaller frustum = zoomed in)
  const zoomFactor = baseZoomFactor / zoom;

  // Apply pan offset to frustum
  return {
    left: -zoomFactor + panX,
    right: zoomFactor + panX,
    top: zoomFactor / viewportAspect + panY,
    bottom: -zoomFactor / viewportAspect + panY,
  };
}

/**
 * Convert in-plane voxel indices to world space coordinates.
 * index1 = horizontal axis, index2 = vertical axis in the slice view.
 */
export function inPlaneVoxelToWorld(
  index1: number,
  index2: number,
  orientation: SliceOrientation,
  volume: NiftiVolume
): WorldPosition {
  const { dimensions, spacing } = volume;

  switch (orientation) {
    case 'axial':
      // index1 = X (sagittal), index2 = Y (coronal)
      return {
        x: (index1 - dimensions.x / 2) * spacing.x,
        y: (index2 - dimensions.y / 2) * spacing.y,
      };
    case 'coronal':
      // index1 = X (sagittal), index2 = Z (axial)
      return {
        x: (index1 - dimensions.x / 2) * spacing.x,
        y: (index2 - dimensions.z / 2) * spacing.z,
      };
    case 'sagittal':
      // index1 = Y (coronal), index2 = Z (axial)
      return {
        x: (index1 - dimensions.y / 2) * spacing.y,
        y: (index2 - dimensions.z / 2) * spacing.z,
      };
  }
}

/**
 * Convert world space coordinates to in-plane voxel indices.
 * Returns unclamped float values - caller should clamp/round as needed.
 */
export function worldToInPlaneVoxel(
  worldX: number,
  worldY: number,
  orientation: SliceOrientation,
  volume: NiftiVolume
): InPlaneVoxelIndices {
  const { dimensions, spacing } = volume;

  switch (orientation) {
    case 'axial':
      return {
        index1: worldX / spacing.x + dimensions.x / 2,
        index2: worldY / spacing.y + dimensions.y / 2,
      };
    case 'coronal':
      return {
        index1: worldX / spacing.x + dimensions.x / 2,
        index2: worldY / spacing.z + dimensions.z / 2,
      };
    case 'sagittal':
      return {
        index1: worldX / spacing.y + dimensions.y / 2,
        index2: worldY / spacing.z + dimensions.z / 2,
      };
  }
}

/**
 * Convert world space coordinates to pixel coordinates.
 */
export function worldToPixel(
  world: WorldPosition,
  viewport: ViewportBounds,
  frustum: CameraFrustum
): PixelPosition {
  // World space to NDC (-1 to 1)
  const ndcX = ((world.x - frustum.left) / (frustum.right - frustum.left)) * 2 - 1;
  const ndcY = ((world.y - frustum.bottom) / (frustum.top - frustum.bottom)) * 2 - 1;

  // NDC to viewport pixels
  return {
    x: viewport.x + ((ndcX + 1) / 2) * viewport.width,
    y: viewport.y + ((1 - ndcY) / 2) * viewport.height,
  };
}

/**
 * Convert pixel coordinates to world space coordinates.
 */
export function pixelToWorld(
  pixel: PixelPosition,
  viewport: ViewportBounds,
  frustum: CameraFrustum
): WorldPosition {
  // Pixel to NDC (-1 to 1)
  const ndcX = ((pixel.x - viewport.x) / viewport.width) * 2 - 1;
  const ndcY = 1 - ((pixel.y - viewport.y) / viewport.height) * 2;

  // NDC to World Space
  return {
    x: frustum.left + ((ndcX + 1) / 2) * (frustum.right - frustum.left),
    y: frustum.bottom + ((ndcY + 1) / 2) * (frustum.top - frustum.bottom),
  };
}

/**
 * Get the in-plane dimension limits for a given orientation.
 * Returns [max1, max2] for bounds checking index1 and index2.
 */
export function getInPlaneDimensionLimits(
  orientation: SliceOrientation,
  dimensions: { x: number; y: number; z: number }
): [number, number] {
  switch (orientation) {
    case 'axial':
      return [dimensions.x, dimensions.y];
    case 'coronal':
      return [dimensions.x, dimensions.z];
    case 'sagittal':
      return [dimensions.y, dimensions.z];
  }
}

/**
 * Clamp and round voxel indices to valid range.
 */
export function clampVoxelIndices(
  indices: InPlaneVoxelIndices,
  orientation: SliceOrientation,
  dimensions: { x: number; y: number; z: number }
): InPlaneVoxelIndices {
  const [max1, max2] = getInPlaneDimensionLimits(orientation, dimensions);
  return {
    index1: Math.max(0, Math.min(max1 - 1, Math.round(indices.index1))),
    index2: Math.max(0, Math.min(max2 - 1, Math.round(indices.index2))),
  };
}

// High-level convenience functions

/**
 * Calculate crosshair pixel positions from voxel indices.
 * Forward transformation: Voxel indices -> World space -> NDC -> Pixel coordinates
 */
export function calculateCrosshairPositions(
  orientation: SliceOrientation,
  sliceIndices: SliceIndices,
  volume: NiftiVolume,
  viewport: ViewportBounds,
  cameraState?: SliceCamera
): CrosshairPosition {
  const frustum = calculateCameraFrustum(
    volume,
    orientation,
    viewport,
    cameraState?.zoom,
    cameraState?.panX,
    cameraState?.panY
  );

  // Get the two orthogonal slice indices that form crosshairs on this view
  let index1: number;
  let index2: number;

  if (orientation === 'axial') {
    index1 = sliceIndices.sagittal;
    index2 = sliceIndices.coronal;
  } else if (orientation === 'coronal') {
    index1 = sliceIndices.sagittal;
    index2 = sliceIndices.axial;
  } else {
    index1 = sliceIndices.coronal;
    index2 = sliceIndices.axial;
  }

  const world = inPlaneVoxelToWorld(index1, index2, orientation, volume);
  const pixel = worldToPixel(world, viewport, frustum);

  return {
    vertical: pixel.x,
    horizontal: pixel.y,
  };
}

/**
 * Convert pixel coordinates to voxel indices with orientation info.
 * Reverse transformation: Pixel coordinates -> NDC -> World space -> Voxel indices
 */
export function pixelToVoxelIndices(
  pixelX: number,
  pixelY: number,
  orientation: SliceOrientation,
  volume: NiftiVolume,
  viewport: ViewportBounds,
  cameraState?: SliceCamera
): VoxelIndicesWithOrientation {
  const frustum = calculateCameraFrustum(
    volume,
    orientation,
    viewport,
    cameraState?.zoom,
    cameraState?.panX,
    cameraState?.panY
  );

  const world = pixelToWorld({ x: pixelX, y: pixelY }, viewport, frustum);
  const rawIndices = worldToInPlaneVoxel(world.x, world.y, orientation, volume);
  const clamped = clampVoxelIndices(rawIndices, orientation, volume.dimensions);

  // Determine which slice orientations correspond to index1 and index2
  let orientation1: keyof SliceIndices;
  let orientation2: keyof SliceIndices;

  if (orientation === 'axial') {
    orientation1 = 'sagittal';
    orientation2 = 'coronal';
  } else if (orientation === 'coronal') {
    orientation1 = 'sagittal';
    orientation2 = 'axial';
  } else {
    orientation1 = 'coronal';
    orientation2 = 'axial';
  }

  return {
    ...clamped,
    orientation1,
    orientation2,
  };
}

/**
 * Convert in-plane voxel indices to pixel position.
 * Convenience function combining voxel -> world -> pixel.
 */
export function voxelToPixel(
  indices: InPlaneVoxelIndices,
  orientation: SliceOrientation,
  volume: NiftiVolume,
  viewport: ViewportBounds,
  cameraState?: SliceCamera
): PixelPosition {
  const frustum = calculateCameraFrustum(
    volume,
    orientation,
    viewport,
    cameraState?.zoom,
    cameraState?.panX,
    cameraState?.panY
  );

  const world = inPlaneVoxelToWorld(indices.index1, indices.index2, orientation, volume);
  return worldToPixel(world, viewport, frustum);
}

/**
 * Convert pixel position to in-plane voxel indices (clamped).
 * Convenience function combining pixel -> world -> voxel.
 */
export function pixelToVoxel(
  pixel: PixelPosition,
  orientation: SliceOrientation,
  volume: NiftiVolume,
  viewport: ViewportBounds,
  cameraState?: SliceCamera
): InPlaneVoxelIndices {
  const frustum = calculateCameraFrustum(
    volume,
    orientation,
    viewport,
    cameraState?.zoom,
    cameraState?.panX,
    cameraState?.panY
  );

  const world = pixelToWorld(pixel, viewport, frustum);
  const rawIndices = worldToInPlaneVoxel(world.x, world.y, orientation, volume);
  return clampVoxelIndices(rawIndices, orientation, volume.dimensions);
}

// ----------------------------------------------------------------------------
// Layout utilities
// ----------------------------------------------------------------------------

/**
 * Get viewport bounds for a specific orientation and layout mode
 */
export function getViewportBounds(
  layoutMode: 'quad' | 'slices',
  orientation: SliceOrientation,
  canvasWidth: number,
  canvasHeight: number,
  panelHeight: number
): ViewportBounds {
  if (layoutMode === 'quad') {
    const halfWidth = canvasWidth / 2;
    const halfHeight = canvasHeight / 2;

    switch (orientation) {
      case 'axial':
        return { x: 0, y: panelHeight, width: halfWidth, height: halfHeight };
      case 'coronal':
        return { x: halfWidth, y: panelHeight, width: halfWidth, height: halfHeight };
      case 'sagittal':
        return {
          x: 0,
          y: panelHeight + halfHeight,
          width: halfWidth,
          height: halfHeight,
        };
      default:
        throw new Error(`Invalid orientation: ${orientation}`);
    }
  } else {
    const thirdWidth = canvasWidth / 3;

    switch (orientation) {
      case 'axial':
        return { x: 0, y: panelHeight, width: thirdWidth, height: canvasHeight };
      case 'coronal':
        return { x: thirdWidth, y: panelHeight, width: thirdWidth, height: canvasHeight };
      case 'sagittal':
        return {
          x: thirdWidth * 2,
          y: panelHeight,
          width: thirdWidth,
          height: canvasHeight,
        };
      default:
        throw new Error(`Invalid orientation: ${orientation}`);
    }
  }
}

/**
 * Determine which slice view was clicked based on pixel position
 */
export function getOrientationFromPixel(
  pixelX: number,
  pixelY: number,
  layoutMode: 'quad' | 'slices',
  canvasWidth: number,
  canvasHeight: number,
  panelHeight: number
): SliceOrientation | null {
  // Adjust Y for panel height
  const canvasY = pixelY - panelHeight;

  // Check if outside canvas bounds
  if (pixelX < 0 || pixelX >= canvasWidth || canvasY < 0 || canvasY >= canvasHeight) {
    return null;
  }

  if (layoutMode === 'quad') {
    const halfWidth = canvasWidth / 2;
    const halfHeight = canvasHeight / 2;

    const isLeft = pixelX < halfWidth;
    const isTop = canvasY < halfHeight;

    if (isTop && isLeft) return 'axial';
    if (isTop && !isLeft) return 'coronal';
    if (!isTop && isLeft) return 'sagittal';
    // Bottom-right is volume view (3D), not a slice
    return null;
  } else {
    const thirdWidth = canvasWidth / 3;

    if (pixelX < thirdWidth) return 'axial';
    if (pixelX < thirdWidth * 2) return 'coronal';
    return 'sagittal';
  }
}
