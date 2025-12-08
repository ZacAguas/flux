/**
 * Slice Interaction and Coordinate Transformation Utilities
 *
 * Handles forward and backward coordinate transformations between pixel space and voxel indices for 2D slice views
 *
 * Forward transformation: Voxel indices -> World space -> NDC -> Pixel coordinates
 * Reverse transformation: Pixel coordinates -> NDC -> World space -> Voxel indices
 */

import type { NiftiVolume } from '../types/nifti';
import type { SliceIndices } from '../types/layout';
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

interface CameraFrustum {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface VoxelIndices {
  index1: number;
  index2: number;
  orientation1: keyof SliceIndices;
  orientation2: keyof SliceIndices;
}

/**
 * Calculate camera frustum bounds for orthographic camera
 * Used by both forward and reverse coordinate transformations
 */
function calculateCameraFrustum(
  volume: NiftiVolume,
  orientation: 'axial' | 'coronal' | 'sagittal',
  viewport: ViewportBounds
): CameraFrustum {
  const sliceDims = getSliceDimensions(volume, orientation);

  // Calculate camera frustum (matching LayoutQuad camera setup logic)
  const viewportAspect = viewport.width / viewport.height;
  const sliceAspect = sliceDims.width / sliceDims.height;
  const isHorizontal = sliceAspect > viewportAspect;

  const zoomFactor = isHorizontal
    ? sliceDims.width / 2
    : (sliceDims.height / 2) * viewportAspect;

  return {
    left: -zoomFactor,
    right: zoomFactor,
    top: zoomFactor / viewportAspect,
    bottom: -zoomFactor / viewportAspect,
  };
}

/**
 * Calculate crosshair pixel positions from voxel indices.
 * Forward transformation: Voxel indices -> World space -> NDC -> Pixel coordinates
 *
 * @param orientation - Which slice view to calculate positions for
 * @param sliceIndices - Current slice indices for all three orientations
 * @param volume - Volume data with dimensions and spacing
 * @param viewport - Viewport bounds for the slice view
 * @returns Pixel positions for horizontal and vertical crosshair lines
 */
export function calculateCrosshairPositions(
  orientation: 'axial' | 'coronal' | 'sagittal',
  sliceIndices: SliceIndices,
  volume: NiftiVolume,
  viewport: ViewportBounds
): CrosshairPosition {
  const { dimensions, spacing } = volume;
  const frustum = calculateCameraFrustum(volume, orientation, viewport);

  // Calculate world positions based on orientation
  let worldX: number, worldY: number;

  if (orientation === 'axial') {
    // Axial (XY plane): vertical at sagittal slice, horizontal at coronal slice
    worldX = (sliceIndices.sagittal - dimensions.x / 2) * spacing.x;
    worldY = (sliceIndices.coronal - dimensions.y / 2) * spacing.y;
  } else if (orientation === 'coronal') {
    // Coronal (XZ plane): vertical at sagittal slice, horizontal at axial slice
    worldX = (sliceIndices.sagittal - dimensions.x / 2) * spacing.x;
    worldY = (sliceIndices.axial - dimensions.z / 2) * spacing.z;
  } else {
    // Sagittal (YZ plane): vertical at coronal slice, horizontal at axial slice
    worldX = (sliceIndices.coronal - dimensions.y / 2) * spacing.y;
    worldY = (sliceIndices.axial - dimensions.z / 2) * spacing.z;
  }

  // Convert world space to NDC (-1 to 1)
  const ndcX = ((worldX - frustum.left) / (frustum.right - frustum.left)) * 2 - 1;
  const ndcY = ((worldY - frustum.bottom) / (frustum.top - frustum.bottom)) * 2 - 1;

  // Convert NDC to viewport pixels
  const pixelX = viewport.x + ((ndcX + 1) / 2) * viewport.width;
  const pixelY = viewport.y + (1 - ndcY) / 2 * viewport.height;

  return {
    vertical: pixelX,
    horizontal: pixelY,
  };
}

/**
 * Convert pixel coordinates to voxel indices
 * Reverse transformation: Pixel coordinates -> NDC -> World space -> Voxel indices
 *
 * @param pixelX - X pixel position relative to canvas
 * @param pixelY - Y pixel position relative to canvas (accounting for panelHeight)
 * @param orientation - Which slice view was clicked
 * @param volume - Volume data with dimensions and spacing
 * @param viewport - Viewport bounds for the clicked slice view
 * @returns Voxel indices for the two orthogonal dimensions
 */
export function pixelToVoxelIndices(
  pixelX: number,
  pixelY: number,
  orientation: 'axial' | 'coronal' | 'sagittal',
  volume: NiftiVolume,
  viewport: ViewportBounds
): VoxelIndices {
  const { dimensions, spacing } = volume;
  const frustum = calculateCameraFrustum(volume, orientation, viewport);

  // Step 1: Pixel to NDC (-1 to 1)
  const ndcX = ((pixelX - viewport.x) / viewport.width) * 2 - 1;
  const ndcY = 1 - ((pixelY - viewport.y) / viewport.height) * 2;

  // Step 2: NDC to World Space
  const worldX = frustum.left + ((ndcX + 1) / 2) * (frustum.right - frustum.left);
  const worldY = frustum.bottom + ((ndcY + 1) / 2) * (frustum.top - frustum.bottom);

  // Step 3: World Space to Voxel Index (orientation-dependent)
  let index1: number;
  let index2: number;
  let orientation1: keyof SliceIndices;
  let orientation2: keyof SliceIndices;

  if (orientation === 'axial') {
    // Axial (XY plane): horizontal = X (sagittal), vertical = Y (coronal)
    index1 = worldX / spacing.x + dimensions.x / 2;
    index2 = worldY / spacing.y + dimensions.y / 2;
    orientation1 = 'sagittal';
    orientation2 = 'coronal';
  } else if (orientation === 'coronal') {
    // Coronal (XZ plane): horizontal = X (sagittal), vertical = Z (axial)
    index1 = worldX / spacing.x + dimensions.x / 2;
    index2 = worldY / spacing.z + dimensions.z / 2;
    orientation1 = 'sagittal';
    orientation2 = 'axial';
  } else {
    // Sagittal (YZ plane): horizontal = Y (coronal), vertical = Z (axial)
    index1 = worldX / spacing.y + dimensions.y / 2;
    index2 = worldY / spacing.z + dimensions.z / 2;
    orientation1 = 'coronal';
    orientation2 = 'axial';
  }

  // Step 4: Clamp to valid range and round to integer
  // orientation1 can be 'sagittal' or 'coronal'
  // orientation2 can be 'coronal' or 'axial'
  const maxIndex1 = orientation1 === 'coronal' ? dimensions.y : dimensions.x;
  const maxIndex2 = orientation2 === 'axial' ? dimensions.z : dimensions.y;

  const clampedIndex1 = Math.max(0, Math.min(maxIndex1 - 1, Math.round(index1)));
  const clampedIndex2 = Math.max(0, Math.min(maxIndex2 - 1, Math.round(index2)));

  return {
    index1: clampedIndex1,
    index2: clampedIndex2,
    orientation1,
    orientation2,
  };
}

/**
 * Get viewport bounds for a specific orientation and layout mode
 *
 * @param layoutMode - 'quad' or 'slices'
 * @param orientation - Which slice view
 * @param canvasWidth - Total canvas width
 * @param canvasHeight - Total canvas height (excluding panelHeight)
 * @param panelHeight - Height of control panel at top
 * @returns Viewport bounds
 */
export function getViewportBounds(
  layoutMode: 'quad' | 'slices',
  orientation: 'axial' | 'coronal' | 'sagittal',
  canvasWidth: number,
  canvasHeight: number,
  panelHeight: number
): ViewportBounds {
  if (layoutMode === 'quad') {
    const halfWidth = canvasWidth / 2;
    const halfHeight = canvasHeight / 2;

    // LayoutQuad: 2x2 grid
    // Top-left: axial, Top-right: coronal
    // Bottom-left: sagittal, Bottom-right: volume (3D)
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
    // LayoutSlices: 3x1 horizontal
    // Left: axial, Center: coronal, Right: sagittal
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
 *
 * @param pixelX - X pixel position relative to window
 * @param pixelY - Y pixel position relative to window
 * @param layoutMode - 'quad' or 'slices'
 * @param canvasWidth - Total canvas width
 * @param canvasHeight - Total canvas height (excluding panelHeight)
 * @param panelHeight - Height of control panel at top
 * @returns Orientation of clicked slice view, or null if clicked outside slice views
 */
export function getOrientationFromPixel(
  pixelX: number,
  pixelY: number,
  layoutMode: 'quad' | 'slices',
  canvasWidth: number,
  canvasHeight: number,
  panelHeight: number
): 'axial' | 'coronal' | 'sagittal' | null {
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
    // LayoutSlices
    const thirdWidth = canvasWidth / 3;

    if (pixelX < thirdWidth) return 'axial';
    if (pixelX < thirdWidth * 2) return 'coronal';
    return 'sagittal';
  }
}
