/**
 * File Handle Permission Utilities
 *
 * Utilities for checking and requesting permissions on FileSystemFileHandle objects.
 * These are required for persisting file access across sessions.
 */

/**
 * Permission status from queryPermission/requestPermission.
 */
export type FileHandlePermissionStatus = 'granted' | 'denied' | 'prompt';

/**
 * Result of attempting to access a file handle.
 */
export interface FileHandleAccessResult {
  file: File | null;
  status: FileHandlePermissionStatus;
  needsPermission: boolean;
  error?: Error;
}

/**
 * Check current permission status for a file handle.
 * Does not prompt the user.
 */
export async function checkFileHandlePermission(
  handle: FileSystemFileHandle,
): Promise<FileHandlePermissionStatus> {
  try {
    // queryPermission may not be available in all browsers
    if ('queryPermission' in handle && typeof handle.queryPermission === 'function') {
      const permission = await handle.queryPermission({ mode: 'read' });
      return permission as FileHandlePermissionStatus;
    }

    // Fallback: Try to access the file and see if it works
    try {
      await handle.getFile();
      return 'granted';
    } catch {
      return 'prompt';
    }
  } catch (error) {
    console.warn('Failed to query file handle permission:', error);
    return 'prompt';
  }
}

/**
 * Request permission for a file handle.
 * IMPORTANT: Must be called from a user gesture (click, keypress, etc.).
 */
export async function requestFileHandlePermission(
  handle: FileSystemFileHandle,
): Promise<FileHandlePermissionStatus> {
  try {
    // requestPermission may not be available in all browsers
    if ('requestPermission' in handle && typeof handle.requestPermission === 'function') {
      const permission = await handle.requestPermission({ mode: 'read' });
      return permission as FileHandlePermissionStatus;
    }

    // Fallback: Just try to access the file
    try {
      await handle.getFile();
      return 'granted';
    } catch {
      return 'denied';
    }
  } catch (error) {
    // User dismissed the permission prompt
    if ((error as Error).name === 'AbortError') {
      return 'prompt';
    }
    console.warn('Failed to request file handle permission:', error);
    return 'denied';
  }
}

/**
 * Try to access a file using a stored handle.
 * Checks permission first and returns detailed status.
 * Does NOT prompt the user - use this for initial permission check.
 */
export async function tryAccessWithPermission(
  handle: FileSystemFileHandle,
): Promise<FileHandleAccessResult> {
  try {
    const status = await checkFileHandlePermission(handle);

    if (status === 'granted') {
      try {
        const file = await handle.getFile();
        return { file, status, needsPermission: false };
      } catch (error) {
        // File might have been moved/deleted
        return {
          file: null,
          status: 'denied',
          needsPermission: false,
          error: error as Error,
        };
      }
    }

    // Permission not granted - caller needs to request it
    return {
      file: null,
      status,
      needsPermission: status === 'prompt',
    };
  } catch (error) {
    return {
      file: null,
      status: 'denied',
      needsPermission: false,
      error: error as Error,
    };
  }
}

/**
 * Request permission and access file if granted.
 * IMPORTANT: Must be called from a user gesture.
 */
export async function accessFileWithPermissionRequest(
  handle: FileSystemFileHandle,
): Promise<FileHandleAccessResult> {
  try {
    const status = await requestFileHandlePermission(handle);

    if (status === 'granted') {
      try {
        const file = await handle.getFile();
        return { file, status, needsPermission: false };
      } catch (error) {
        // File might have been moved/deleted
        return {
          file: null,
          status: 'denied',
          needsPermission: false,
          error: error as Error,
        };
      }
    }

    return {
      file: null,
      status,
      needsPermission: false,
    };
  } catch (error) {
    return {
      file: null,
      status: 'denied',
      needsPermission: false,
      error: error as Error,
    };
  }
}

/**
 * Check if the File System Access API with permissions is available.
 */
export function isFileSystemAccessSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'showOpenFilePicker' in window &&
    typeof window.showOpenFilePicker === 'function'
  );
}
