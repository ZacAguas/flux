import type { SliceIndices } from '../types/layout';
import type { NiftiVolume } from '../types/nifti';
import { getSliceDimensions } from './layout';

interface CrosshairPosition {
  horizontal: number; // Y pixel position for horizontal line
  vertical: number;   // X pixel position for vertical line
}

interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function calculateCrosshairPositions(
  orientation: 'axial' | 'coronal' | 'sagittal',
  sliceIndices: SliceIndices,
  volume: NiftiVolume,
  viewport: ViewportBounds
): CrosshairPosition {
  const { dimensions, spacing } = volume;
  const sliceDims = getSliceDimensions(volume, orientation);

  // Calculate camera frustum (matching LayoutQuad camera setup logic)
  const viewportAspect = viewport.width / viewport.height;
  const sliceAspect = sliceDims.width / sliceDims.height;
  const isHorizontal = sliceAspect > viewportAspect;

  const zoomFactor = isHorizontal
    ? sliceDims.width / 2
    : sliceDims.height / 2 * viewportAspect;

  const cameraLeft = -zoomFactor;
  const cameraRight = zoomFactor;
  const cameraTop = zoomFactor / viewportAspect;
  const cameraBottom = -zoomFactor / viewportAspect;

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
  const ndcX = (worldX - cameraLeft) / (cameraRight - cameraLeft) * 2 - 1;
  const ndcY = (worldY - cameraBottom) / (cameraTop - cameraBottom) * 2 - 1;

  // Convert NDC to viewport pixels
  const pixelX = viewport.x + (ndcX + 1) / 2 * viewport.width;
  const pixelY = viewport.y + (1 - ndcY) / 2 * viewport.height;

  if (orientation === 'sagittal') {
    console.log('bottom/top:', viewport.y, viewport.y + viewport.height);
    console.log('pixel positions:', pixelX, pixelY);
  }
  return {
    vertical: pixelX,
    horizontal: pixelY
  };
}
