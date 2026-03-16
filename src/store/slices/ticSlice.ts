/**
 * TIC Slice
 *
 * State management for Time Intensity Curve ROI placement and curve data.
 */

import type { StateCreator } from 'zustand';
import type { ViewerStore } from '../storeTypes';
import type { TicROI, TicCurve, TicDragPreview } from '../../types/tic';

export interface TicSlice {
  // State
  ticRois: TicROI[];
  ticCurves: Record<string, TicCurve>; // Keyed by ROI id, computed on ROI creation
  ticToolActive: boolean;
  ticDragPreview: TicDragPreview | null;

  // Actions
  setTicToolActive: (active: boolean) => void;
  addTicRoi: (roi: TicROI, curve: TicCurve) => void;
  deleteTicRoi: (id: string) => void;
  clearTicRois: () => void;
  setTicDragPreview: (preview: TicDragPreview | null) => void;

  // Bulk operations for session restore
  setTicRois: (rois: TicROI[], curves: Record<string, TicCurve>) => void;
}

export const createTicSlice: StateCreator<ViewerStore, [], [], TicSlice> = (set, get) => ({
  // Initial state
  ticRois: [],
  ticCurves: {},
  ticToolActive: false,
  ticDragPreview: null,

  setTicToolActive: (active) => set({ ticToolActive: active }),

  addTicRoi: (roi, curve) => {
    set((state) => ({
      ticRois: [...state.ticRois, roi],
      ticCurves: { ...state.ticCurves, [roi.id]: curve },
    }));

    // Mark session dirty if available
    const markDirty = (get() as ViewerStore).markDirty;
    if (markDirty) {
      markDirty();
    }
  },

  deleteTicRoi: (id) => {
    set((state) => {
      const curves = { ...state.ticCurves };
      delete curves[id];
      return {
        ticRois: state.ticRois.filter((r) => r.id !== id),
        ticCurves: curves,
      };
    });

    // Mark session dirty if available
    const markDirty = (get() as ViewerStore).markDirty;
    if (markDirty) {
      markDirty();
    }
  },

  clearTicRois: () => {
    set({ ticRois: [], ticCurves: {} });

    // Mark session dirty if available
    const markDirty = (get() as ViewerStore).markDirty;
    if (markDirty) {
      markDirty();
    }
  },

  setTicDragPreview: (preview) => set({ ticDragPreview: preview }),

  setTicRois: (rois, curves) => set({ ticRois: rois, ticCurves: curves }),
});
