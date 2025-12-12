import { create } from 'zustand';
import type * as THREE from 'three';
import type { NiftiVolume } from '../types/nifti';
import type { LayoutMode, SliceIndices, WindowLevel } from '../types/layout';
import type { RaymarchSettings, TransferFunction, TransferFunctionPoint } from '../types/volume';
import { getPresetByName } from '../data/transferFunctionPresets';

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
  transferFunction: boolean;
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
  popoverOpen: boolean;
  raymarchSettings: RaymarchSettings;
  transferFunction: TransferFunction;
  transferFunctionTexture: THREE.DataTexture | null;
  activeTransferFunctionPreset: string;

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
  setPopoverOpen: (open: boolean) => void;
  toggleAllSections: (expanded: boolean) => void;
  setRaymarchSettings: (settings: Partial<RaymarchSettings>) => void;
  setTransferFunction: (tf: TransferFunction) => void;
  updateTransferFunctionPoint: (index: number, point: Partial<TransferFunctionPoint>) => void;
  addTransferFunctionPoint: (point: TransferFunctionPoint) => void;
  removeTransferFunctionPoint: (index: number) => void;
  applyTransferFunctionPreset: (presetName: string) => void;
  setTransferFunctionTexture: (texture: THREE.DataTexture | null) => void;
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
    transferFunction: false,
    measurementsTools: false,
    presetsSettings: false,
  },
  popoverOpen: false,
  raymarchSettings: {
    stepSize: 0.01,
    opacity: 1.0,
    threshold: 0.1,
    qualityPreset: 'standard',
  },
  transferFunction: {
    points: [
      { value: 0.0, color: { r: 0, g: 0, b: 0 }, opacity: 0.0 },
      { value: 1.0, color: { r: 255, g: 255, b: 255 }, opacity: 1.0 },
    ],
    range: { min: 0, max: 1 },
  },
  transferFunctionTexture: null,
  activeTransferFunctionPreset: 'default',

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

  setPopoverOpen: (open) => set({ popoverOpen: open }),

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

  setTransferFunction: (tf) => set({ transferFunction: tf, activeTransferFunctionPreset: 'custom' }),

  updateTransferFunctionPoint: (index, pointUpdate) =>
    set((state) => {
      const newPoints = [...state.transferFunction.points];
      newPoints[index] = { ...newPoints[index], ...pointUpdate };
      return {
        transferFunction: { ...state.transferFunction, points: newPoints },
        activeTransferFunctionPreset: 'custom',
      };
    }),

  addTransferFunctionPoint: (point) =>
    set((state) => {
      const newPoints = [...state.transferFunction.points, point].sort(
        (a, b) => a.value - b.value
      );
      return {
        transferFunction: { ...state.transferFunction, points: newPoints },
        activeTransferFunctionPreset: 'custom',
      };
    }),

  removeTransferFunctionPoint: (index) =>
    set((state) => {
      const newPoints = state.transferFunction.points.filter((_, i) => i !== index);
      return {
        transferFunction: { ...state.transferFunction, points: newPoints },
        activeTransferFunctionPreset: 'custom',
      };
    }),

  applyTransferFunctionPreset: (presetName) => {
    const preset = getPresetByName(presetName);
    if (preset) {
      set({
        transferFunction: {
          points: preset.points,
          range: { min: 0, max: 1 },
        },
        activeTransferFunctionPreset: presetName,
      });
    }
  },

  setTransferFunctionTexture: (texture) => {
    // Dispose old texture if it exists
    const oldTexture = get().transferFunctionTexture;
    if (oldTexture) {
      oldTexture.dispose();
    }
    set({ transferFunctionTexture: texture });
  },
}));
