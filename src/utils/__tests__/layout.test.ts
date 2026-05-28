import { describe, it, expect } from 'vitest';
import { getSliceDimensions, getVolumeDimensions } from '../layout';
import type { NiftiVolume } from '../../types/nifti';

// 256x128x64 with spacing chosen so all physical dims are equal (256mm each)
const vol: NiftiVolume = {
  header: {} as NiftiVolume['header'],
  data: new Float32Array(0),
  dimensions: { x: 256, y: 128, z: 64 },
  spacing: { x: 1.0, y: 2.0, z: 4.0 },
  dataRange: { min: 0, max: 4095 },
};

describe('getSliceDimensions', () => {
  it('returns XY plane dimensions for axial', () => {
    // width = 256 * 1.0 = 256, height = 128 * 2.0 = 256
    expect(getSliceDimensions(vol, 'axial')).toEqual({ width: 256, height: 256 });
  });

  it('returns XZ plane dimensions for coronal', () => {
    // width = 256 * 1.0 = 256, height = 64 * 4.0 = 256
    expect(getSliceDimensions(vol, 'coronal')).toEqual({ width: 256, height: 256 });
  });

  it('returns YZ plane dimensions for sagittal', () => {
    // width = 128 * 2.0 = 256, height = 64 * 4.0 = 256
    expect(getSliceDimensions(vol, 'sagittal')).toEqual({ width: 256, height: 256 });
  });
});

describe('getVolumeDimensions', () => {
  it('returns all-1 for isotropic physical dimensions', () => {
    // Physical: 256mm x 256mm x 256mm → max = 256 → all 1
    const dims = getVolumeDimensions(vol);
    expect(dims.width).toBeCloseTo(1);
    expect(dims.height).toBeCloseTo(1);
    expect(dims.depth).toBeCloseTo(1);
  });

  it('normalizes so the largest dimension is 1', () => {
    const aniso: NiftiVolume = {
      ...vol,
      dimensions: { x: 100, y: 50, z: 25 },
      spacing: { x: 1, y: 1, z: 1 },
    };
    // Physical: 100mm x 50mm x 25mm → max = 100
    const dims = getVolumeDimensions(aniso);
    expect(dims.width).toBeCloseTo(1);    // 100/100
    expect(dims.height).toBeCloseTo(0.5); // 50/100
    expect(dims.depth).toBeCloseTo(0.25); // 25/100
  });
});
