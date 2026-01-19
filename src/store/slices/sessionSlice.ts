/**
 * Session Slice
 *
 * Manages session metadata, dirty state tracking, and current session info.
 * Does NOT handle actual save/load operations (those are in hooks/utils).
 */

import type { StateCreator } from 'zustand';
import type { ViewerStore } from '../storeTypes';

export interface SessionSlice {
  // State
  isDirty: boolean;
  currentSessionId: string | null;
  currentSessionName: string | null;
  lastAutoSave: number | null;

  // New Volume Modal State (shared between SessionManager and drag-and-drop)
  pendingNewVolumeFile: File | null;
  pendingNewVolumeFileHandle: FileSystemFileHandle | null;
  showNewVolumeUnsavedModal: boolean;

  // Actions
  markDirty: () => void;
  markClean: () => void;
  setCurrentSession: (id: string, name: string) => void;
  clearCurrentSession: () => void;
  setLastAutoSave: (timestamp: number | null) => void;
  setPendingNewVolumeFile: (file: File | null, fileHandle?: FileSystemFileHandle | null) => void;
  setShowNewVolumeUnsavedModal: (show: boolean) => void;
}

export const createSessionSlice: StateCreator<
  ViewerStore,
  [],
  [],
  SessionSlice
> = (set) => ({
  // Initial state
  isDirty: false,
  currentSessionId: null,
  currentSessionName: null,
  lastAutoSave: null,
  pendingNewVolumeFile: null,
  pendingNewVolumeFileHandle: null,
  showNewVolumeUnsavedModal: false,

  // Mark state as dirty (unsaved changes)
  markDirty: () => {
    set({ isDirty: true });
  },

  // Mark state as clean (no unsaved changes)
  markClean: () => {
    set({ isDirty: false });
  },

  // Set the currently loaded/saved session
  setCurrentSession: (id: string, name: string) => {
    set({
      currentSessionId: id,
      currentSessionName: name,
    });
  },

  // Clear current session (e.g., when loading new volume)
  clearCurrentSession: () => {
    set({
      currentSessionId: null,
      currentSessionName: null,
      isDirty: false,
    });
  },

  // Update last auto-save timestamp
  setLastAutoSave: (timestamp: number | null) => {
    set({ lastAutoSave: timestamp });
  },

  // Set pending file for new volume loading (with optional file handle)
  setPendingNewVolumeFile: (file: File | null, fileHandle?: FileSystemFileHandle | null) => {
    set({
      pendingNewVolumeFile: file,
      pendingNewVolumeFileHandle: fileHandle ?? null,
    });
  },

  // Show/hide unsaved changes modal for new volume
  setShowNewVolumeUnsavedModal: (show: boolean) => {
    set({ showNewVolumeUnsavedModal: show });
  },
});
