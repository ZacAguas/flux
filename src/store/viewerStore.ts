import { create } from 'zustand';
import type * as THREE from 'three';
import type { NiftiVolume } from '../types/nifti';
import type { LayoutMode, SliceIndices, WindowLevel } from '../types/layout';

interface ViewerStore {
  // State
  layoutMode: LayoutMode;
  volume: NiftiVolume | null;
  volumeTexture: THREE.Data3DTexture | null;
  sliceIndices: SliceIndices;
  windowLevel: WindowLevel;
  showCrosshairs: boolean;
  timeStep: number;
  controlPanelOpen: boolean;

  // Actions
  setLayoutMode: (mode: LayoutMode) => void;
  setVolume: (volume: NiftiVolume, texture: THREE.Data3DTexture) => void;
  setSliceIndex: (orientation: keyof SliceIndices, index: number) => void;
  setWindowLevel: (windowLevel: Partial<WindowLevel>) => void;
  setShowCrosshairs: (show: boolean) => void;
  setTimeStep: (step: number) => void;
  setControlPanelOpen: (open: boolean) => void;
}

export const useViewerStore = create<ViewerStore>((set, get) => ({
  // Initial state
  layoutMode: 'single',
  volume: null,
  volumeTexture: null,
  sliceIndices: {
    axial: 0,
    coronal: 0,
    sagittal: 0,
  },
  windowLevel: {
    center: 0,
    width: 1,
  },
  showCrosshairs: true,
  timeStep: 0,
  controlPanelOpen: true,

  // Actions
  setLayoutMode: (mode) => set({ layoutMode: mode }),

  setVolume: (volume, texture) => {
    // Dispose old texture if it exists
    const oldTexture = get().volumeTexture;
    if (oldTexture) {
      oldTexture.dispose();
    }

    // Calculate initial slice indices (middle of each dimension)
    const sliceIndices: SliceIndices = {
      axial: Math.floor(volume.dimensions.z / 2),
      coronal: Math.floor(volume.dimensions.y / 2),
      sagittal: Math.floor(volume.dimensions.x / 2),
    };

    // Calculate initial window/level (full range)
    const windowLevel: WindowLevel = {
      center: (volume.dataRange.min + volume.dataRange.max) / 2,
      width: volume.dataRange.max - volume.dataRange.min,
    };

    set({
      volume,
      volumeTexture: texture,
      sliceIndices,
      windowLevel,
      timeStep: 0,
    });
  },

  setSliceIndex: (orientation, index) =>
    set((state) => ({
      sliceIndices: {
        ...state.sliceIndices,
        [orientation]: index,
      },
    })),

  setWindowLevel: (newWindowLevel) =>
    set((state) => ({
      windowLevel: {
        ...state.windowLevel,
        ...newWindowLevel,
      },
    })),

  setShowCrosshairs: (show) => set({ showCrosshairs: show }),

  setTimeStep: (step) => set({ timeStep: step }),

  setControlPanelOpen: (open) => set({ controlPanelOpen: open }),
}));
