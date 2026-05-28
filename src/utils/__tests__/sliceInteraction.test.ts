import { describe, it, expect } from 'vitest';
import {
  calculateCameraFrustum,
  inPlaneVoxelToWorld,
  worldToInPlaneVoxel,
  worldToPixel,
  pixelToWorld,
  getInPlaneDimensionLimits,
  clampVoxelIndices,
  getViewportBounds,
} from '../sliceInteraction';
import type { NiftiVolume } from '../../types/nifti';
import type { ViewportBounds, CameraFrustum } from '../sliceInteraction';

const vol: NiftiVolume = {
  header: {} as NiftiVolume['header'],
  data: new Float32Array(0),
  dimensions: { x: 256, y: 256, z: 128 },
  spacing: { x: 1.0, y: 1.0, z: 1.5 },
  dataRange: { min: 0, max: 4095 },
};

// Square viewport with square axial slice for clean frustum math
const squareViewport: ViewportBounds = { x: 0, y: 0, width: 256, height: 256 };

describe('calculateCameraFrustum', () => {
  it('produces symmetric frustum for square slice in square viewport at zoom=1', () => {
    // sliceDims = 256x256, viewport = 256x256, viewportAspect = 1
    // isHorizontal = false → baseZoomFactor = 128 × 1 = 128
    const f = calculateCameraFrustum(vol, 'axial', squareViewport, 1);
    expect(f.left).toBeCloseTo(-128);
    expect(f.right).toBeCloseTo(128);
    expect(f.top).toBeCloseTo(128);
    expect(f.bottom).toBeCloseTo(-128);
  });

  it('halves frustum size when zoomed in 2×', () => {
    const f = calculateCameraFrustum(vol, 'axial', squareViewport, 2);
    expect(f.left).toBeCloseTo(-64);
    expect(f.right).toBeCloseTo(64);
    expect(f.top).toBeCloseTo(64);
    expect(f.bottom).toBeCloseTo(-64);
  });

  it('shifts frustum by pan offset', () => {
    const f = calculateCameraFrustum(vol, 'axial', squareViewport, 1, 10, 20);
    expect(f.left).toBeCloseTo(-118);
    expect(f.right).toBeCloseTo(138);
    expect(f.top).toBeCloseTo(148);
    expect(f.bottom).toBeCloseTo(-108);
  });
});

describe('inPlaneVoxelToWorld / worldToInPlaneVoxel', () => {
  const orientations = ['axial', 'coronal', 'sagittal'] as const;

  for (const orientation of orientations) {
    it(`round-trips voxel → world → voxel for ${orientation}`, () => {
      const i1 = 100, i2 = 60;
      const world = inPlaneVoxelToWorld(i1, i2, orientation, vol);
      const back = worldToInPlaneVoxel(world.x, world.y, orientation, vol);
      expect(back.index1).toBeCloseTo(i1);
      expect(back.index2).toBeCloseTo(i2);
    });
  }

  it('maps center voxel to world origin for axial', () => {
    const w = inPlaneVoxelToWorld(128, 128, 'axial', vol);
    expect(w.x).toBeCloseTo(0);
    expect(w.y).toBeCloseTo(0);
  });
});

describe('worldToPixel / pixelToWorld', () => {
  const frustum: CameraFrustum = { left: -128, right: 128, top: 128, bottom: -128 };
  const viewport: ViewportBounds = { x: 0, y: 0, width: 256, height: 256 };

  it('maps world origin to center pixel', () => {
    const p = worldToPixel({ x: 0, y: 0 }, viewport, frustum);
    expect(p.x).toBeCloseTo(128);
    expect(p.y).toBeCloseTo(128);
  });

  it('round-trips pixel → world → pixel', () => {
    const pixel = { x: 100, y: 75 };
    const world = pixelToWorld(pixel, viewport, frustum);
    const back = worldToPixel(world, viewport, frustum);
    expect(back.x).toBeCloseTo(pixel.x);
    expect(back.y).toBeCloseTo(pixel.y);
  });
});

describe('getInPlaneDimensionLimits', () => {
  it('returns [x, y] for axial', () => {
    expect(getInPlaneDimensionLimits('axial', vol.dimensions)).toEqual([256, 256]);
  });
  it('returns [x, z] for coronal', () => {
    expect(getInPlaneDimensionLimits('coronal', vol.dimensions)).toEqual([256, 128]);
  });
  it('returns [y, z] for sagittal', () => {
    expect(getInPlaneDimensionLimits('sagittal', vol.dimensions)).toEqual([256, 128]);
  });
});

describe('clampVoxelIndices', () => {
  it('clamps negative indices to 0', () => {
    const result = clampVoxelIndices({ index1: -5, index2: -10 }, 'axial', vol.dimensions);
    expect(result.index1).toBe(0);
    expect(result.index2).toBe(0);
  });

  it('clamps out-of-bounds indices to max - 1', () => {
    const result = clampVoxelIndices({ index1: 300, index2: 300 }, 'axial', vol.dimensions);
    expect(result.index1).toBe(255);
    expect(result.index2).toBe(255);
  });

  it('rounds fractional indices', () => {
    const result = clampVoxelIndices({ index1: 10.7, index2: 20.3 }, 'axial', vol.dimensions);
    expect(result.index1).toBe(11);
    expect(result.index2).toBe(20);
  });
});

describe('getViewportBounds', () => {
  it('splits quad layout into four equal quadrants', () => {
    expect(getViewportBounds('quad', 'axial', 800, 600)).toEqual({ x: 0, y: 0, width: 400, height: 300 });
    expect(getViewportBounds('quad', 'coronal', 800, 600)).toEqual({ x: 400, y: 0, width: 400, height: 300 });
    expect(getViewportBounds('quad', 'sagittal', 800, 600)).toEqual({ x: 0, y: 300, width: 400, height: 300 });
  });

  it('splits slices layout into three equal vertical panels', () => {
    expect(getViewportBounds('slices', 'axial', 900, 600)).toEqual({ x: 0, y: 0, width: 300, height: 600 });
    expect(getViewportBounds('slices', 'coronal', 900, 600)).toEqual({ x: 300, y: 0, width: 300, height: 600 });
    expect(getViewportBounds('slices', 'sagittal', 900, 600)).toEqual({ x: 600, y: 0, width: 300, height: 600 });
  });
});
