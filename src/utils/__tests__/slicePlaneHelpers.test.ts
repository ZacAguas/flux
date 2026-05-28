import { vi, describe, it, expect } from 'vitest';

// Mock THREE and the shader import to avoid WebGPU dependencies in tests
vi.mock('three/webgpu', () => ({}));
vi.mock('../../shaders/sliceShader', () => ({ createSliceMaterial: vi.fn() }));

import { calculateSlicePlanePosition, calculateSlicePlaneScale } from '../slicePlaneHelpers';
import type { NiftiVolume } from '../../types/nifti';

const vol: NiftiVolume = {
  header: {} as NiftiVolume['header'],
  data: new Float32Array(0),
  dimensions: { x: 256, y: 256, z: 128 },
  spacing: { x: 1.0, y: 1.0, z: 2.0 },
  dataRange: { min: 0, max: 4095 },
};

describe('calculateSlicePlanePosition', () => {
  it('places axial plane at z=0 for center slice', () => {
    // center slice = 64: (64 - 128/2) * 2.0 = 0
    expect(calculateSlicePlanePosition(64, 'axial', vol)).toBeCloseTo(0);
  });

  it('places axial plane at -128 for slice 0', () => {
    // (0 - 64) * 2.0 = -128
    expect(calculateSlicePlanePosition(0, 'axial', vol)).toBeCloseTo(-128);
  });

  it('places coronal plane at y=0 for center slice', () => {
    // (128 - 256/2) * 1.0 = 0
    expect(calculateSlicePlanePosition(128, 'coronal', vol)).toBeCloseTo(0);
  });

  it('places sagittal plane at x=0 for center slice', () => {
    // (128 - 256/2) * 1.0 = 0
    expect(calculateSlicePlanePosition(128, 'sagittal', vol)).toBeCloseTo(0);
  });

  it('places sagittal plane at x=128 for slice 256', () => {
    // (256 - 128) * 1.0 = 128
    expect(calculateSlicePlanePosition(256, 'sagittal', vol)).toBeCloseTo(128);
  });
});

describe('calculateSlicePlaneScale', () => {
  const dims = { width: 256, height: 128, depth: 64 };

  it('returns XY scale for axial', () => {
    expect(calculateSlicePlaneScale('axial', dims)).toEqual({ width: 256, height: 128 });
  });

  it('returns XZ scale for coronal', () => {
    expect(calculateSlicePlaneScale('coronal', dims)).toEqual({ width: 256, height: 64 });
  });

  it('returns YZ scale for sagittal', () => {
    expect(calculateSlicePlaneScale('sagittal', dims)).toEqual({ width: 128, height: 64 });
  });
});
