import type { StateCreator } from 'zustand';
import type { ViewerStore, RenderingSlice } from '../storeTypes';
import { getPresetByName } from '../../data/transferFunctionPresets';

export const createRenderingSlice: StateCreator<ViewerStore, [], [], RenderingSlice> = (set, get) => ({
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
  clippingPlanes: {
    axial: { enabled: false, position: 0.5, inverted: false },
    coronal: { enabled: false, position: 0.5, inverted: false },
    sagittal: { enabled: false, position: 0.5, inverted: false },
  },
  clippingPlaneVisualization: {
    showPlanes: true,
    opacity: 0.3,
    colors: {
      axial: '#0080FF',
      coronal: '#00FF00',
      sagittal: '#FF0000',
    },
  },

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

  setClippingPlane: (orientation, planeUpdate) =>
    set((state) => ({
      clippingPlanes: {
        ...state.clippingPlanes,
        [orientation]: {
          ...state.clippingPlanes[orientation],
          ...planeUpdate,
        },
      },
    })),

  setClippingPlaneVisualization: (newSettings) =>
    set((state) => ({
      clippingPlaneVisualization: {
        ...state.clippingPlaneVisualization,
        ...newSettings,
        colors: {
          ...state.clippingPlaneVisualization.colors,
          ...(newSettings.colors || {}),
        },
      },
    })),

  resetClippingPlanes: () =>
    set({
      clippingPlanes: {
        axial: { enabled: false, position: 0.5, inverted: false },
        coronal: { enabled: false, position: 0.5, inverted: false },
        sagittal: { enabled: false, position: 0.5, inverted: false },
      },
    }),
});