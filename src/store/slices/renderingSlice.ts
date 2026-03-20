import type { StateCreator } from 'zustand';
import type { ViewerStore, RenderingSlice } from '../storeTypes';
import { getPresetByName } from '../../data/transferFunctionPresets';

const DEFAULT_CROP_BOX = {
  enabled: false,
  axial: { min: 0.0, max: 1.0 },
  coronal: { min: 0.0, max: 1.0 },
  sagittal: { min: 0.0, max: 1.0 },
} as const;

export const createRenderingSlice: StateCreator<ViewerStore, [], [], RenderingSlice> = (set, get) => ({
  showSlicePlanes: false,
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
  raymarchSettings: {
    stepSize: 0.01,
    opacity: 1.0,
    threshold: 0.1,
    thresholdMax: 1.0,
    qualityPreset: 'standard',
    shadingEnabled: true,
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
  cropBox: { ...DEFAULT_CROP_BOX },

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
    const oldTexture = get().transferFunctionTexture;
    if (oldTexture) {
      oldTexture.dispose();
    }
    set({ transferFunctionTexture: texture });
  },

  setCropBox: (update) =>
    set((state) => ({
      cropBox: {
        ...state.cropBox,
        ...update,
      },
    })),

  setCropBoxAxis: (axis, bounds) =>
    set((state) => {
      const current = state.cropBox[axis];
      const newMin = bounds.min !== undefined ? Math.max(0, Math.min(bounds.min, current.max - 0.01)) : current.min;
      const newMax = bounds.max !== undefined ? Math.min(1, Math.max(bounds.max, current.min + 0.01)) : current.max;
      // Enforce min <= max - 0.01
      const clampedMin = Math.min(newMin, newMax - 0.01);
      const clampedMax = Math.max(newMax, newMin + 0.01);
      return {
        cropBox: {
          ...state.cropBox,
          [axis]: { min: clampedMin, max: clampedMax },
        },
      };
    }),

  resetCropBox: () =>
    set({
      cropBox: { ...DEFAULT_CROP_BOX },
    }),
});
