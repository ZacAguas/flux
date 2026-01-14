/**
 * Volume Reference Manager
 *
 * Utilities for creating volume file references, validating files,
 * and handling file selection with FileSystemFileHandle support.
 */

import type { VolumeFileReference, VolumeValidationResult } from '../types/session';

/**
 * Create a volume reference from a File object.
 * Generates multi-chunk hash for robust validation.
 */
export async function createVolumeReference(file: File): Promise<VolumeFileReference> {
  const fileHash = await calculateFileHash(file);

  // Try to get FileSystemFileHandle if supported
  let fileHandle: FileSystemFileHandle | undefined;
  if ('showOpenFilePicker' in window) {
    // NOTE: We can't get a handle from a dropped/selected file directly
    // The handle can only be stored when using showOpenFilePicker
    // For now, leave this undefined and only store handles
    // when loading sessions (which will use showOpenFilePicker)
    fileHandle = undefined;
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    lastModified: file.lastModified,
    fileHash,
    fileHandle,
  };
}

/**
 * Validate a file against a volume reference.
 * Returns detailed validation result with expected and actual values.
 */
export async function validateVolumeFile(
  file: File,
  reference: VolumeFileReference,
): Promise<VolumeValidationResult> {
  const actualHash = await calculateFileHash(file);

  const expected = {
    fileName: reference.fileName,
    fileSize: reference.fileSize,
    lastModified: reference.lastModified,
    fileHash: reference.fileHash,
  };

  const actual = {
    fileName: file.name,
    fileSize: file.size,
    lastModified: file.lastModified,
    fileHash: actualHash,
  };

  const isValid =
    actual.fileName === expected.fileName &&
    actual.fileSize === expected.fileSize &&
    actual.lastModified === expected.lastModified &&
    actual.fileHash === expected.fileHash;

  return {
    isValid,
    expected,
    actual,
  };
}

/**
 * Calculate multi-chunk hash for robust file validation.
 * Hashes: first 1KB (header) + middle chunk + last chunk.
 * This catches files with identical headers but different data.
 */
export async function calculateFileHash(file: File): Promise<string> {
  const CHUNK_SIZE = 1024; // 1KB chunks

  // Read three chunks
  const chunks: ArrayBuffer[] = [];

  // Chunk 1: First 1KB (NIfTI header)
  const headerSize = Math.min(CHUNK_SIZE, file.size);
  chunks.push(await readFileChunk(file, 0, headerSize));

  // Chunk 2: Middle of file
  if (file.size > CHUNK_SIZE * 2) {
    const middleStart = Math.floor(file.size / 2);
    chunks.push(await readFileChunk(file, middleStart, CHUNK_SIZE));
  }

  // Chunk 3: Last 1KB
  if (file.size > CHUNK_SIZE) {
    const endStart = Math.max(0, file.size - CHUNK_SIZE);
    chunks.push(await readFileChunk(file, endStart, CHUNK_SIZE));
  }

  // Combine chunks and hash
  const combined = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0));
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }

  // Use SubtleCrypto for fast, secure hashing
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Read a chunk of a file.
 */
async function readFileChunk(file: File, start: number, length: number): Promise<ArrayBuffer> {
  const blob = file.slice(start, start + length);
  return blob.arrayBuffer();
}

/**
 * Prompt user to select a volume file.
 * Optionally suggests a specific filename.
 * Returns the selected File and optionally a FileSystemFileHandle.
 */
export async function promptForVolumeFile(): Promise<{ file: File; fileHandle?: FileSystemFileHandle }> {
  // Try File System Access API first (provides file handle)
  if ('showOpenFilePicker' in window && typeof window.showOpenFilePicker === 'function') {
    try {
      const options = {
        types: [
          {
            description: 'NIfTI Files',
            accept: {
              'application/octet-stream': ['.nii', '.gz'],
            },
          },
        ],
        multiple: false,
      };

      const [fileHandle] = await (window.showOpenFilePicker as (options?: unknown) => Promise<FileSystemFileHandle[]>)(options);

      const file = await fileHandle.getFile();
      return { file, fileHandle };
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name === 'AbortError') {
        throw new Error('File selection cancelled');
      }
      // Fall through to fallback
    }
  }

  // Fallback: use traditional file input
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.nii,.nii.gz';

    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        resolve({ file });
      } else {
        reject(new Error('No file selected'));
      }
    };

    input.oncancel = () => {
      reject(new Error('File selection cancelled'));
    };

    input.click();
  });
}

/**
 * Try to re-access a file using a stored FileSystemFileHandle.
 * Returns the file if successful, null if permission denied or file not found.
 */
export async function tryAccessFileHandle(
  fileHandle: FileSystemFileHandle,
): Promise<File | null> {
  try {
    // Just try to get the file directly
    // Permission API may not be available on all browsers
    return await fileHandle.getFile();
  } catch (error) {
    // File not found, permission error, or other issue
    console.warn('Failed to access file handle:', error);
    return null;
  }
}

/**
 * Attempt to load a volume file, trying FileSystemFileHandle first,
 * falling back to prompting the user.
 */
export async function resolveVolumeFile(
  reference: VolumeFileReference,
): Promise<{ file: File; fileHandle?: FileSystemFileHandle }> {
  // Try FileSystemFileHandle if available
  if (reference.fileHandle) {
    const file = await tryAccessFileHandle(reference.fileHandle);
    if (file) {
      return { file, fileHandle: reference.fileHandle };
    }
  }

  // Fallback: prompt user to select the file
  return promptForVolumeFile();
}
