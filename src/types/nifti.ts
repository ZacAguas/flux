/**
 * NIfTI file format types and interfaces
 * Uses nifti-reader-js library for parsing
 */

import type * as nifti from 'nifti-reader-js';

// Re-export library types for convenience
export type { nifti };

/**
 * Parsed NIfTI volume data
 */
export interface NiftiVolume {
  header: nifti.NIFTI1 | nifti.NIFTI2;
  data: TypedArray;
  dimensions: {
    x: number;
    y: number;
    z: number;
    t?: number; // Time dimension (optional, for 4D data)
  };
  spacing: {
    x: number;
    y: number;
    z: number;
    t?: number;
  };
  dataRange: {
    min: number;
    max: number;
  };
}

/**
 * Union type for all possible typed arrays
 */
export type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;
