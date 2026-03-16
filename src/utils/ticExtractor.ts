/**
 * TIC Extractor
 *
 * Pure function to extract a Time Intensity Curve from a 4D NIfTI volume
 * for a given circular ROI. Operates on the CPU using raw volume data.
 */

import type { NiftiVolume } from '../types/nifti';
import type { TicROI, TicCurve } from '../types/tic';

/**
 * Extract mean intensity across all time steps for a circular ROI.
 *
 * Coordinate mapping by orientation:
 *   Axial:    depth=z=sliceIndex, index1=x, index2=y
 *   Coronal:  depth=y=sliceIndex, index1=x, index2=z
 *   Sagittal: depth=x=sliceIndex, index1=y, index2=z
 *
 * Voxel offset formula: x + y*dimX + z*dimX*dimY + t*dimX*dimY*dimZ
 */
export function extractTicCurve(volume: NiftiVolume, roi: TicROI): TicCurve {
  const { data, dimensions, spacing } = volume;
  const { x: dimX, y: dimY, z: dimZ, t: dimT } = dimensions;
  const numTimeSteps = dimT ?? 1;

  // NOTE: Number of voxels in one 3D volume. Multiplying by t gives the byte
  // offset into the flat data array for time step t (NIfTI stores time as the
  // 4th dimension after x, y, z in row-major order).
  const sliceStride = dimX * dimY * dimZ;

  // Determine voxel coordinate mapping
  const { orientation, sliceIndex, centerIndex1, centerIndex2, radiusVoxels } = roi;
  const r2 = radiusVoxels * radiusVoxels;

  // Bounding box for the ROI in index1/index2 space
  const i1Min = Math.max(0, Math.floor(centerIndex1 - radiusVoxels));
  const i2Min = Math.max(0, Math.floor(centerIndex2 - radiusVoxels));

  let i1Max: number;
  let i2Max: number;

  if (orientation === 'axial') {
    i1Max = Math.min(dimX - 1, Math.ceil(centerIndex1 + radiusVoxels));
    i2Max = Math.min(dimY - 1, Math.ceil(centerIndex2 + radiusVoxels));
  } else if (orientation === 'coronal') {
    i1Max = Math.min(dimX - 1, Math.ceil(centerIndex1 + radiusVoxels));
    i2Max = Math.min(dimZ - 1, Math.ceil(centerIndex2 + radiusVoxels));
  } else {
    // sagittal
    i1Max = Math.min(dimY - 1, Math.ceil(centerIndex1 + radiusVoxels));
    i2Max = Math.min(dimZ - 1, Math.ceil(centerIndex2 + radiusVoxels));
  }

  const intensities: number[] = [];
  const timeAxis: number[] = [];
  // NOTE: TR (repetition time) is the time between successive volume
  // acquisitions (seconds).
  // Convert step index to real time so the X axis reads in seconds.
  const hasTR = spacing.t !== undefined && spacing.t > 0;

  for (let t = 0; t < numTimeSteps; t++) {
    const tOffset = t * sliceStride;
    let sum = 0;
    let count = 0;

    for (let i1 = i1Min; i1 <= i1Max; i1++) {
      const d1 = i1 - centerIndex1;
      for (let i2 = i2Min; i2 <= i2Max; i2++) {
        const d2 = i2 - centerIndex2;
        // Circular mask check
        if (d1 * d1 + d2 * d2 > r2) continue;

        let voxelOffset: number;
        if (orientation === 'axial') {
          // index1=x, index2=y, depth=z=sliceIndex
          voxelOffset = i1 + i2 * dimX + sliceIndex * dimX * dimY;
        } else if (orientation === 'coronal') {
          // index1=x, index2=z, depth=y=sliceIndex
          voxelOffset = i1 + sliceIndex * dimX + i2 * dimX * dimY;
        } else {
          // sagittal: index1=y, index2=z, depth=x=sliceIndex
          voxelOffset = sliceIndex + i1 * dimX + i2 * dimX * dimY;
        }

        sum += data[tOffset + voxelOffset] as number;
        count++;
      }
    }

    intensities.push(count > 0 ? sum / count : 0);
    timeAxis.push(hasTR ? t * (spacing.t as number) : t);
  }

  return { roiId: roi.id, intensities, timeAxis };
}
