import { describe, it, expect } from 'vitest';
import {
  getInPlaneSpacing,
  calculateDistance,
  calculateAngle,
  formatDistance,
  formatAngle,
  getMidpoint,
  getLabelOffset,
} from '../measurementUtils';
import type { NiftiVolume } from '../../types/nifti';
import type { MeasurementPoint } from '../../types/measurement';

const vol: NiftiVolume = {
  header: {} as NiftiVolume['header'],
  data: new Float32Array(0),
  dimensions: { x: 256, y: 256, z: 128 },
  spacing: { x: 1.0, y: 2.0, z: 3.0 },
  dataRange: { min: 0, max: 4095 },
};

const isoVol: NiftiVolume = { ...vol, spacing: { x: 1, y: 1, z: 1 } };

function pt(index1: number, index2: number): MeasurementPoint {
  return { index1, index2 };
}

describe('getInPlaneSpacing', () => {
  it('returns [x, y] spacing for axial', () => {
    expect(getInPlaneSpacing('axial', vol.spacing)).toEqual([1.0, 2.0]);
  });
  it('returns [x, z] spacing for coronal', () => {
    expect(getInPlaneSpacing('coronal', vol.spacing)).toEqual([1.0, 3.0]);
  });
  it('returns [y, z] spacing for sagittal', () => {
    expect(getInPlaneSpacing('sagittal', vol.spacing)).toEqual([2.0, 3.0]);
  });
});

describe('calculateDistance', () => {
  it('calculates horizontal distance with voxel spacing', () => {
    // axial: dx = 10 * 1.0 = 10, dy = 0 → 10mm
    expect(calculateDistance(pt(0, 50), pt(10, 50), 'axial', vol)).toBeCloseTo(10);
  });

  it('calculates vertical distance with voxel spacing', () => {
    // axial: dx = 0, dy = 5 * 2.0 = 10 → 10mm
    expect(calculateDistance(pt(50, 0), pt(50, 5), 'axial', vol)).toBeCloseTo(10);
  });

  it('calculates diagonal distance using physical spacing', () => {
    // coronal: dx = 3 * 1.0 = 3, dz = 4 * 3.0 = 12 → sqrt(9 + 144)
    const d = calculateDistance(pt(0, 0), pt(3, 4), 'coronal', vol);
    expect(d).toBeCloseTo(Math.sqrt(9 + 144));
  });

  it('returns 0 for coincident points', () => {
    expect(calculateDistance(pt(5, 5), pt(5, 5), 'sagittal', vol)).toBe(0);
  });
});

describe('calculateAngle', () => {
  it('calculates 90° angle', () => {
    // p1=(1,0), vertex=(0,0), p3=(0,1) → perpendicular vectors → 90°
    expect(calculateAngle(pt(1, 0), pt(0, 0), pt(0, 1), 'axial', isoVol)).toBeCloseTo(90);
  });

  it('calculates 180° for collinear points', () => {
    // p1=(-1,0), vertex=(0,0), p3=(1,0) → opposite directions → 180°
    expect(calculateAngle(pt(-1, 0), pt(0, 0), pt(1, 0), 'axial', isoVol)).toBeCloseTo(180);
  });

  it('returns 0 when a leg has zero length', () => {
    // p1 == vertex → zero-length vector → returns 0
    expect(calculateAngle(pt(0, 0), pt(0, 0), pt(1, 0), 'axial', isoVol)).toBe(0);
  });
});

describe('formatDistance', () => {
  it('uses 1 decimal for distances >= 10mm', () => {
    expect(formatDistance(123.456)).toBe('123.5 mm');
    expect(formatDistance(10)).toBe('10.0 mm');
  });

  it('uses 2 decimals for distances 1–9.99mm', () => {
    expect(formatDistance(5.678)).toBe('5.68 mm');
    expect(formatDistance(1)).toBe('1.00 mm');
  });

  it('uses 3 decimals for distances < 1mm', () => {
    expect(formatDistance(0.5)).toBe('0.500 mm');
    expect(formatDistance(0.001)).toBe('0.001 mm');
  });
});

describe('formatAngle', () => {
  it('formats angle with 1 decimal and degree symbol', () => {
    expect(formatAngle(90)).toBe('90.0°');
    expect(formatAngle(45.678)).toBe('45.7°');
  });
});

describe('getMidpoint', () => {
  it('returns midpoint of two points', () => {
    expect(getMidpoint({ x: 0, y: 0 }, { x: 10, y: 20 })).toEqual({ x: 5, y: 10 });
  });

  it('works with negative coordinates', () => {
    expect(getMidpoint({ x: -10, y: -20 }, { x: 10, y: 20 })).toEqual({ x: 0, y: 0 });
  });
});

describe('getLabelOffset', () => {
  it('returns perpendicular offset for a horizontal line', () => {
    // Line along x-axis → perpendicular is y-axis → offset is (0, 15)
    const off = getLabelOffset({ x: 0, y: 0 }, { x: 10, y: 0 }, 15);
    expect(off.x).toBeCloseTo(0);
    expect(off.y).toBeCloseTo(15);
  });

  it('returns perpendicular offset for a vertical line', () => {
    // Line along y-axis → perpendicular is negative x → offset is (-15, 0)
    const off = getLabelOffset({ x: 0, y: 0 }, { x: 0, y: 10 }, 15);
    expect(off.x).toBeCloseTo(-15);
    expect(off.y).toBeCloseTo(0);
  });

  it('returns fallback offset for zero-length line', () => {
    const off = getLabelOffset({ x: 5, y: 5 }, { x: 5, y: 5 }, 15);
    expect(off).toEqual({ x: 15, y: 0 });
  });
});
