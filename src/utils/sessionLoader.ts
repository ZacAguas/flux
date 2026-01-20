/**
 * Session Loader Utility
 *
 * Shared utilities for loading session volumes and applying state.
 * Used by useLoadSession and useAutoSaveRestore hooks.
 */

import { useViewerStore } from '../store/viewerStore';
import {
  resolveVolumeFile,
  validateVolumeFile,
  promptForVolumeFile,
  requestFileHandleAccess,
} from './volumeReference';
import { deserializeViewerState } from './stateSerializer';
import { parseNifti } from './niftiParser';
import { createVolumeTexture } from './volumeTextureConverter';
import type { ViewerSession, VolumeValidationResult } from '../types/session';

export type ResolveSessionFileResult =
  | { status: 'resolved'; file: File; fileHandle?: FileSystemFileHandle }
  | { status: 'needs-permission'; fileHandle: FileSystemFileHandle }
  | { status: 'no-handle' };

export type LoadSessionResult =
  | { status: 'success' }
  | { status: 'validation-failed'; validation: VolumeValidationResult; file: File; fileHandle?: FileSystemFileHandle }
  | { status: 'cancelled' }
  | { status: 'error'; error: Error };

/**
 * Attempt to resolve a volume file from a session's volume reference.
 * Returns the file if available, or indicates if permission is needed.
 */
export async function resolveSessionFile(
  session: ViewerSession,
): Promise<ResolveSessionFileResult> {
  const resolveResult = await resolveVolumeFile(session.volumeReference);

  if (resolveResult.file) {
    return {
      status: 'resolved',
      file: resolveResult.file,
      fileHandle: resolveResult.fileHandle,
    };
  }

  if (resolveResult.needsPermission && resolveResult.fileHandle) {
    return {
      status: 'needs-permission',
      fileHandle: resolveResult.fileHandle,
    };
  }

  return { status: 'no-handle' };
}

/**
 * Request permission for a file handle and get the file.
 * MUST be called from a user gesture.
 */
export async function requestSessionFileAccess(
  fileHandle: FileSystemFileHandle,
): Promise<{ file: File | null; denied: boolean }> {
  const result = await requestFileHandleAccess(fileHandle);

  if (result.file) {
    return { file: result.file, denied: false };
  }

  return { file: null, denied: result.status === 'denied' };
}

/**
 * Prompt user to select a volume file.
 * Returns null if user cancels.
 */
export async function promptSessionFile(): Promise<{
  file: File;
  fileHandle?: FileSystemFileHandle;
} | null> {
  try {
    return await promptForVolumeFile();
  } catch (error) {
    if ((error as Error).message === 'File selection cancelled') {
      return null;
    }
    throw error;
  }
}

/**
 * Validate a file against a session's volume reference.
 */
export async function validateSessionFile(
  file: File,
  session: ViewerSession,
): Promise<VolumeValidationResult> {
  return validateVolumeFile(file, session.volumeReference);
}

/**
 * Load a volume file and apply session state to the store.
 * This is the core loading logic shared by all session loading flows.
 */
export async function loadVolumeAndApplyState(
  file: File,
  session: ViewerSession,
  fileHandle?: FileSystemFileHandle,
): Promise<void> {
  const setVolume = useViewerStore.getState().setVolume;

  const volume = await parseNifti(file);
  const texture = createVolumeTexture(volume, session.viewerState.timeStep ?? 0);

  const metadata = {
    fileName: session.volumeReference.fileName,
    fileSize: session.volumeReference.fileSize,
    fileHash: session.volumeReference.fileHash,
    lastModified: session.volumeReference.lastModified,
    fileHandle: fileHandle ?? session.volumeReference.fileHandle,
  };

  setVolume(volume, texture, metadata);
  deserializeViewerState(session.viewerState, useViewerStore.getState());
}

/**
 * Full flow to load a session with a given file.
 * Validates the file and loads if valid.
 * Returns validation result if file doesn't match.
 */
export async function loadSessionWithFile(
  file: File,
  session: ViewerSession,
  fileHandle?: FileSystemFileHandle,
  skipValidation = false,
): Promise<LoadSessionResult> {
  try {
    if (!skipValidation) {
      const validation = await validateSessionFile(file, session);
      if (!validation.isValid) {
        return {
          status: 'validation-failed',
          validation,
          file,
          fileHandle,
        };
      }
    }

    await loadVolumeAndApplyState(file, session, fileHandle);
    return { status: 'success' };
  } catch (error) {
    return { status: 'error', error: error as Error };
  }
}
