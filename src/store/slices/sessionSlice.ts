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

  // Actions
  markDirty: () => void;
  markClean: () => void;
  setCurrentSession: (id: string, name: string) => void;
  clearCurrentSession: () => void;
  setLastAutoSave: (timestamp: number | null) => void;
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
});
