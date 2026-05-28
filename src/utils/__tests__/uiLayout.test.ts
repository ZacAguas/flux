import { describe, it, expect } from 'vitest';
import { inject4D, selectIs4D } from '../uiLayout';
import type { NiftiVolume } from '../../types/nifti';

describe('inject4D', () => {
  const base = ['a', 'b', 'c'];

  it('returns the base array unchanged when not 4D', () => {
    expect(inject4D(base, 'x', false, 1)).toEqual(['a', 'b', 'c']);
  });

  it('inserts item at the given index when 4D', () => {
    expect(inject4D(base, 'x', true, 1)).toEqual(['a', 'x', 'b', 'c']);
  });

  it('inserts at index 0', () => {
    expect(inject4D(base, 'x', true, 0)).toEqual(['x', 'a', 'b', 'c']);
  });

  it('appends at the end', () => {
    expect(inject4D(base, 'x', true, 3)).toEqual(['a', 'b', 'c', 'x']);
  });
});

describe('selectIs4D', () => {
  it('returns false when volume is null', () => {
    expect(selectIs4D({ volume: null })).toBe(false);
  });

  it('returns false for a 3D volume with no t dimension', () => {
    const vol: NiftiVolume = {
      header: {} as NiftiVolume['header'],
      data: new Float32Array(0),
      dimensions: { x: 256, y: 256, z: 128 },
      spacing: { x: 1, y: 1, z: 1 },
      dataRange: { min: 0, max: 4095 },
    };
    expect(selectIs4D({ volume: vol })).toBe(false);
  });

  it('returns false when t = 1', () => {
    const vol: NiftiVolume = {
      header: {} as NiftiVolume['header'],
      data: new Float32Array(0),
      dimensions: { x: 256, y: 256, z: 128, t: 1 },
      spacing: { x: 1, y: 1, z: 1 },
      dataRange: { min: 0, max: 4095 },
    };
    expect(selectIs4D({ volume: vol })).toBe(false);
  });

  it('returns true when t > 1', () => {
    const vol: NiftiVolume = {
      header: {} as NiftiVolume['header'],
      data: new Float32Array(0),
      dimensions: { x: 256, y: 256, z: 128, t: 10 },
      spacing: { x: 1, y: 1, z: 1 },
      dataRange: { min: 0, max: 4095 },
    };
    expect(selectIs4D({ volume: vol })).toBe(true);
  });
});
