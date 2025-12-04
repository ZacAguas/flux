/**
 * NIfTI file parser wrapper
 * Uses nifti-reader-js library
 */

import * as nifti from 'nifti-reader-js';
import type { NiftiVolume, TypedArray } from '../types';

/**
 * Calculate min and max values in data array
 */
function calculateDataRange(data: TypedArray): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    if (value < min) min = value;
    if (value > max) max = value;
  }

  return { min, max };
}

/**
 * Get typed array view of NIfTI image data
 */
function getTypedArray(
  data: ArrayBuffer,
  header: nifti.NIFTI1 | nifti.NIFTI2
): TypedArray {
  const datatype = header.datatypeCode;

  // Map NIfTI datatype codes to TypedArray constructors
  switch (datatype) {
    case nifti.NIFTI1.TYPE_UINT8:
      return new Uint8Array(data);
    case nifti.NIFTI1.TYPE_INT8:
      return new Int8Array(data);
    case nifti.NIFTI1.TYPE_INT16:
      return new Int16Array(data);
    case nifti.NIFTI1.TYPE_UINT16:
      return new Uint16Array(data);
    case nifti.NIFTI1.TYPE_INT32:
      return new Int32Array(data);
    case nifti.NIFTI1.TYPE_UINT32:
      return new Uint32Array(data);
    case nifti.NIFTI1.TYPE_FLOAT32:
      return new Float32Array(data);
    case nifti.NIFTI1.TYPE_FLOAT64:
      return new Float64Array(data);
    default:
      // Default to Float32 for unsupported types
      console.warn(`Unsupported datatype: ${datatype}, using Float32Array`);
      return new Float32Array(data);
  }
}

/**
 * Parse NIfTI file using nifti-reader-js
 */
export async function parseNifti(file: File): Promise<NiftiVolume> {
  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Check if this is a valid NIfTI file
  if (!nifti.isCompressed(arrayBuffer)) {
    if (!nifti.isNIFTI(arrayBuffer)) {
      throw new Error('Not a valid NIfTI file');
    }
  }

  // Decompress if needed
  let data: ArrayBufferLike = arrayBuffer;
  if (nifti.isCompressed(arrayBuffer)) {
    data = nifti.decompress(arrayBuffer);
  }

  // Read header
  const header = nifti.readHeader(data as ArrayBuffer);
  if (!header) {
    throw new Error('Failed to read NIfTI header');
  }

  // Get image data
  const imageData = nifti.readImage(header, data as ArrayBuffer);
  const typedData = getTypedArray(imageData, header);

  // Extract dimensions
  const dims = header.dims;
  const nx = dims[1];
  const ny = dims[2];
  const nz = dims[3];
  const nt = dims[4] > 1 ? dims[4] : undefined;

  // Extract voxel spacing
  const pixdim = header.pixDims;
  const spacing = {
    x: pixdim[1],
    y: pixdim[2],
    z: pixdim[3],
    t: nt ? pixdim[4] : undefined,
  };

  // Calculate data range
  const dataRange = calculateDataRange(typedData);

  return {
    header,
    data: typedData,
    dimensions: { x: nx, y: ny, z: nz, t: nt },
    spacing,
    dataRange,
  };
}
