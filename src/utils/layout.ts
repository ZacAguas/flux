
import type { NiftiVolume } from '../types/nifti';
import type { SliceOrientation } from '../types/layout';

/**
 * Calculates the dimensions of a slice based on the volume data and orientation.
 *
 * @param volume The NIfTI volume.
 * @param orientation The orientation of the slice.
 * @returns The width and height of the slice.
 */
export function getSliceDimensions(volume: NiftiVolume, orientation: SliceOrientation) {
  const { dimensions, spacing } = volume;
  let width, height;

  if (orientation === 'axial') {
    // XY plane
    width = dimensions.x * spacing.x;
    height = dimensions.y * spacing.y;
  } else if (orientation === 'coronal') {
    // XZ plane
    width = dimensions.x * spacing.x;
    height = dimensions.z * spacing.z;
  } else {
    // Sagittal: YZ plane
    width = dimensions.y * spacing.y;
    height = dimensions.z * spacing.z;
  }

  return { width, height };
}

/**
 * Calculates the normalized dimensions of the volume.
 *
 * @param volume The NIfTI volume.
 * @returns The normalized width, height, and depth of the volume.
 */
export function getVolumeDimensions(volume: NiftiVolume) {
  const { dimensions, spacing } = volume;
  const width = dimensions.x * spacing.x;
  const height = dimensions.y * spacing.y;
  const depth = dimensions.z * spacing.z;

  const maxDim = Math.max(width, height, depth);

  return {
    width: width / maxDim,
    height: height / maxDim,
    depth: depth / maxDim,
  };
}
