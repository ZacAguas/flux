/**
 * useAutoSave Hook
 *
 * Automatically saves session every 2 minutes when dirty.
 * Handles auto-save restore on app mount with graceful error handling.
 */

import { useEffect } from 'react';
import { useViewerStore } from '../store/viewerStore';
import { serializeViewerState, getCurrentVersion } from '../utils/stateSerializer';
import { autoSaveSession, getAutoSave, clearAutoSave } from '../utils/sessionStorage';
import type { ViewerSession } from '../types/session';

const AUTO_SAVE_INTERVAL = 2 * 60 * 1000; // 2 minutes

export function useAutoSave() {
  const store = useViewerStore();
  const isDirty = useViewerStore((state) => state.isDirty);
  const volume = useViewerStore((state) => state.volume);
  const setLastAutoSave = useViewerStore((state) => state.setLastAutoSave);

  // Auto-save effect
  useEffect(() => {
    if (!volume) return; // No volume loaded, nothing to save

    const interval = setInterval(async () => {
      if (!isDirty) return; // No changes to save

      try {
        // Flush pending updates by reading directly from store
        const viewerState = serializeViewerState(useViewerStore.getState());

        // Create minimal volume reference
        // FIXME: In production, should store original File object
        const volumeReference = {
          fileName: useViewerStore.getState().volumeFileName || 'unknown.nii',
          fileSize: 0,
          lastModified: Date.now(),
          fileHash: '',
        };

        const session: ViewerSession = {
          version: getCurrentVersion(),
          timestamp: Date.now(),
          volumeReference,
          viewerState,
        };

        await autoSaveSession(session);
        setLastAutoSave(Date.now());

        console.log('Auto-save completed');
      } catch (error) {
        console.error('Auto-save failed:', error);
        // Silent failure - don't interrupt user
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [isDirty, volume, store, setLastAutoSave]);

  return null;
}

/**
 * Check for auto-save on app mount and offer to restore.
 * Call this once when the app initializes.
 */
export async function checkAutoSaveOnMount(): Promise<ViewerSession | null> {
  try {
    const autoSave = await getAutoSave();
    if (autoSave) {
      console.log('Auto-save found');
      return autoSave;
    }
    return null;
  } catch (error) {
    console.error('Failed to check auto-save:', error);
    return null;
  }
}

/**
 * Clear auto-save (after successful restore or user dismissal).
 */
export async function dismissAutoSave(): Promise<void> {
  try {
    await clearAutoSave();
    console.log('Auto-save dismissed');
  } catch (error) {
    console.error('Failed to clear auto-save:', error);
  }
}
