import { describe, it, expect } from 'vitest';
import { rgbToHex, hexToRgb, rgbToRgbaString } from '../colorConversion';

describe('rgbToHex', () => {
  it('converts primary colors', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000');
    expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe('#00ff00');
    expect(rgbToHex({ r: 0, g: 0, b: 255 })).toBe('#0000ff');
  });

  it('converts black and white', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
  });

  it('pads single hex digits', () => {
    expect(rgbToHex({ r: 1, g: 2, b: 3 })).toBe('#010203');
  });

  it('clamps values below 0', () => {
    expect(rgbToHex({ r: -10, g: 0, b: 0 })).toBe('#000000');
  });

  it('clamps values above 255', () => {
    expect(rgbToHex({ r: 300, g: 0, b: 0 })).toBe('#ff0000');
  });

  it('rounds fractional values', () => {
    expect(rgbToHex({ r: 255.7, g: 0, b: 0 })).toBe('#ff0000');
    expect(rgbToHex({ r: 0.3, g: 0, b: 0 })).toBe('#000000');
  });
});

describe('hexToRgb', () => {
  it('parses hex with # prefix', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('parses hex without # prefix', () => {
    expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('is the inverse of rgbToHex', () => {
    const original = { r: 100, g: 150, b: 200 };
    expect(hexToRgb(rgbToHex(original))).toEqual(original);
  });
});

describe('rgbToRgbaString', () => {
  it('formats rgba string correctly', () => {
    expect(rgbToRgbaString({ r: 255, g: 85, b: 0 }, 0.5)).toBe('rgba(255, 85, 0, 0.5)');
    expect(rgbToRgbaString({ r: 0, g: 0, b: 0 }, 1)).toBe('rgba(0, 0, 0, 1)');
    expect(rgbToRgbaString({ r: 255, g: 255, b: 255 }, 0)).toBe('rgba(255, 255, 255, 0)');
  });
});
