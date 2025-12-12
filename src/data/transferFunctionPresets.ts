/**
 * Transfer Function Presets
 *
 * Predefined transfer functions for common medical imaging scenarios.
 * Each preset defines control points mapping intensity values (0-1) to
 * color (RGB 0-255) and opacity (0-1).
 */

import type { TransferFunctionPreset } from '../types/volume';

export const TRANSFER_FUNCTION_PRESETS: TransferFunctionPreset[] = [
  {
    name: 'default',
    description: 'Linear grayscale with full opacity',
    points: [
      { value: 0.0, color: { r: 0, g: 0, b: 0 }, opacity: 0.0 },
      { value: 1.0, color: { r: 255, g: 255, b: 255 }, opacity: 1.0 },
    ],
  },
  {
    name: 'bone',
    description: 'CT bone visualization - emphasizes high-density structures',
    points: [
      { value: 0.0, color: { r: 0, g: 0, b: 0 }, opacity: 0.0 },
      { value: 0.3, color: { r: 100, g: 50, b: 30 }, opacity: 0.0 },
      { value: 0.5, color: { r: 200, g: 180, b: 150 }, opacity: 0.3 },
      { value: 1.0, color: { r: 255, g: 255, b: 255 }, opacity: 1.0 },
    ],
  },
  {
    name: 'ct-aaa',
    description: 'CT abdominal aortic aneurysm - vessel contrast visualization',
    points: [
      { value: 0.0, color: { r: 0, g: 0, b: 0 }, opacity: 0.0 },
      { value: 0.2, color: { r: 60, g: 20, b: 20 }, opacity: 0.0 },
      { value: 0.4, color: { r: 180, g: 60, b: 60 }, opacity: 0.5 },
      { value: 0.7, color: { r: 255, g: 100, b: 100 }, opacity: 0.8 },
      { value: 1.0, color: { r: 255, g: 200, b: 200 }, opacity: 1.0 },
    ],
  },
  {
    name: 'ct-bone',
    description: 'CT bone with muscle - shows both bone and soft tissue',
    points: [
      { value: 0.0, color: { r: 0, g: 0, b: 0 }, opacity: 0.0 },
      { value: 0.2, color: { r: 50, g: 30, b: 30 }, opacity: 0.1 },
      { value: 0.4, color: { r: 120, g: 80, b: 60 }, opacity: 0.2 },
      { value: 0.6, color: { r: 200, g: 160, b: 120 }, opacity: 0.5 },
      { value: 1.0, color: { r: 255, g: 240, b: 220 }, opacity: 1.0 },
    ],
  },
  {
    name: 'mri-default',
    description: 'MRI default - balanced soft tissue contrast',
    points: [
      { value: 0.0, color: { r: 0, g: 0, b: 0 }, opacity: 0.0 },
      { value: 0.15, color: { r: 40, g: 40, b: 80 }, opacity: 0.05 },
      { value: 0.35, color: { r: 100, g: 100, b: 180 }, opacity: 0.2 },
      { value: 0.65, color: { r: 180, g: 180, b: 220 }, opacity: 0.5 },
      { value: 1.0, color: { r: 255, g: 255, b: 255 }, opacity: 1.0 },
    ],
  },
];

/**
 * Get a preset by name
 */
export function getPresetByName(name: string): TransferFunctionPreset | undefined {
  return TRANSFER_FUNCTION_PRESETS.find((preset) => preset.name === name);
}

/**
 * Get all preset names
 */
export function getPresetNames(): string[] {
  return TRANSFER_FUNCTION_PRESETS.map((preset) => preset.name);
}
