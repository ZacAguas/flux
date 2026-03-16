/**
 * Crop Box Types
 *
 * Type definitions for the axis-aligned crop box in the 3D volume viewer.
 */

export interface CropBoxAxis {
  min: number; // [0, 1] normalized volume space
  max: number; // [0, 1] normalized volume space
}

export interface CropBox {
  enabled: boolean;
  axial: CropBoxAxis;    // Z-axis bounds
  coronal: CropBoxAxis;  // Y-axis bounds
  sagittal: CropBoxAxis; // X-axis bounds
}

