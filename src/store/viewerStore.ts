import { create } from 'zustand';
import type * as THREE from 'three';
import type { NiftiVolume } from '../types/nifti';
import type { LayoutMode, SliceIndices, WindowLevel } from '../types/layout';
import type { RaymarchSettings } from '../types/volume';

interface CrosshairSettings {
  color: string;
  opacity: number;
}

interface SlicePlaneSettings {
  opacity: number;
  mode: 'textured' | 'colored'; // Textured (actual slices) or colored (solid RGB)
  visibility: {
    axial: boolean;
    coronal: boolean;
    sagittal: boolean;
  };
  colors: {
    axial: string;
    coronal: string;
    sagittal: string;
  };
}

interface ControlPanelSections {
  viewSettings: boolean;
  viewOptions: boolean;
  rendering3D: boolean;
  measurementsTools: boolean;
  presetsSettings: boolean;
}

interface ViewerStore {
  // State
  layoutMode: LayoutMode;
  volume: NiftiVolume | null;
  volumeTexture: THREE.Data3DTexture | null;
  sliceIndices: SliceIndices;
  windowLevel: WindowLevel;
  showCrosshairs: boolean;
  crosshairSettings: CrosshairSettings;
  showSlicePlanes: boolean;
  slicePlaneSettings: SlicePlaneSettings;
  timeStep: number;
  controlPanelOpen: boolean;
  controlPanelPinned: boolean;
  controlPanelContentHeight: number;
  controlPanelSections: ControlPanelSections;
  raymarchSettings: RaymarchSettings;

  // Actions
  setLayoutMode: (mode: LayoutMode) => void;
  setVolume: (volume: NiftiVolume, texture: THREE.Data3DTexture) => void;
  setSliceIndex: (orientation: keyof SliceIndices, index: number) => void;
  setWindowLevel: (windowLevel: Partial<WindowLevel>) => void;
  setShowCrosshairs: (show: boolean) => void;
  setCrosshairSettings: (settings: Partial<CrosshairSettings>) => void;
  setShowSlicePlanes: (show: boolean) => void;
  setSlicePlaneSettings: (settings: Partial<SlicePlaneSettings>) => void;
  setTimeStep: (step: number) => void;
  setControlPanelOpen: (open: boolean) => void;
  setControlPanelPinned: (isPinned: boolean) => void;
  setControlPanelContentHeight: (height: number) => void;
  setControlPanelSectionExpanded: (sectionId: string, expanded: boolean) => void;
  toggleAllSections: (expanded: boolean) => void;
  setRaymarchSettings: (settings: Partial<RaymarchSettings>) => void;
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
  crosshairSettings: {
    color: '#00FF00',
    opacity: 0.7,
  },
  showSlicePlanes: true,
  slicePlaneSettings: {
    opacity: 0.35,
    mode: 'textured',
    visibility: {
      axial: true,
      coronal: true,
      sagittal: true,
    },
    colors: {
      axial: '#0080FF',
      coronal: '#00FF00',
      sagittal: '#FF0000',
    },
  },
  timeStep: 0,
  controlPanelOpen: true,
  controlPanelPinned: true,
  controlPanelContentHeight: 0,
  controlPanelSections: {
    viewSettings: true,
    viewOptions: false,
    rendering3D: true,
    measurementsTools: false,
    presetsSettings: false,
  },
  raymarchSettings: {
    stepSize: 0.01,
    opacity: 1.0,
    threshold: 0.1,
    qualityPreset: 'standard',
  },

  // Actions
  setLayoutMode: (mode) => {
    const currentMode = get().layoutMode;

    // Auto collapse/expand sections based on layout mode
    if (mode !== currentMode) {
      const sections = get().controlPanelSections;

      if (mode === 'single') {
        // Single mode: collapse view settings (slices disabled), expand 3D rendering
        set({
          layoutMode: mode,
          controlPanelSections: {
            ...sections,
            viewSettings: false,
            rendering3D: true,
          },
        });
      } else if (mode === 'slices') {
        // Slices mode: expand view settings, collapse 3D rendering
        set({
          layoutMode: mode,
          controlPanelSections: {
            ...sections,
            viewSettings: true,
            rendering3D: false,
          },
        });
      } else if (mode === 'quad') {
        // Quad mode: expand both view settings and 3D rendering
        set({
          layoutMode: mode,
          controlPanelSections: {
            ...sections,
            viewSettings: true,
            rendering3D: true,
          },
        });
      } else {
        set({ layoutMode: mode });
      }
    } else {
      set({ layoutMode: mode });
    }
  },

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

  setCrosshairSettings: (newSettings) =>
    set((state) => ({
      crosshairSettings: {
        ...state.crosshairSettings,
        ...newSettings,
      },
    })),

  setShowSlicePlanes: (show) => set({ showSlicePlanes: show }),

  setSlicePlaneSettings: (newSettings) =>
    set((state) => ({
      slicePlaneSettings: {
        ...state.slicePlaneSettings,
        ...newSettings,
        visibility: {
          ...state.slicePlaneSettings.visibility,
          ...(newSettings.visibility || {}),
        },
        colors: {
          ...state.slicePlaneSettings.colors,
          ...(newSettings.colors || {}),
        },
      },
    })),

  setTimeStep: (step) => set({ timeStep: step }),

  setControlPanelOpen: (open) => set({ controlPanelOpen: open }),

  setControlPanelPinned: (isPinned) => set({ controlPanelPinned: isPinned }),

  setControlPanelContentHeight: (height) => set({ controlPanelContentHeight: height }),

  setControlPanelSectionExpanded: (sectionId, expanded) =>
    set((state) => ({
      controlPanelSections: {
        ...state.controlPanelSections,
        [sectionId]: expanded,
      },
    })),

  toggleAllSections: (expanded) =>
    set((state) => ({
      controlPanelSections: {
        ...Object.keys(state.controlPanelSections).reduce(
          (acc, key) => ({ ...acc, [key]: expanded }),
          {} as ControlPanelSections
        ),
      },
    })),

  setRaymarchSettings: (newSettings) =>
    set((state) => ({
      raymarchSettings: {
        ...state.raymarchSettings,
        ...newSettings,
      },
    })),
}));
