import type { StateCreator } from 'zustand';
import type { ViewerStore, ViewSlice } from '../storeTypes';
import { defaultSliceCamera } from '../constants';

export const createViewSlice: StateCreator<ViewerStore, [], [], ViewSlice> = (set) => ({
  sliceIndices: {
    axial: 0,
    coronal: 0,
    sagittal: 0,
  },
  sliceCameraState: {
    axial: { ...defaultSliceCamera },
    coronal: { ...defaultSliceCamera },
    sagittal: { ...defaultSliceCamera },
  },
  volumeCameraState: {
    position: [0, 0, 5],
    target: [0, 0, 0],
    zoom: 100,
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
  showMetricOverlays: true,

  setSliceIndex: (orientation, index) =>
    set((state) => ({
      sliceIndices: {
        ...state.sliceIndices,
        [orientation]: index,
      },
    })),

  setSliceCamera: (orientation, camera) =>
    set((state) => ({
      sliceCameraState: {
        ...state.sliceCameraState,
        [orientation]: {
          ...state.sliceCameraState[orientation],
          ...camera,
        },
      },
    })),

  resetSliceCamera: (orientation) =>
    set((state) => ({
      sliceCameraState: {
        ...state.sliceCameraState,
        [orientation]: { ...defaultSliceCamera },
      },
    })),

  resetAllSliceCameras: () =>
    set({
      sliceCameraState: {
        axial: { ...defaultSliceCamera },
        coronal: { ...defaultSliceCamera },
        sagittal: { ...defaultSliceCamera },
      },
    }),

  setVolumeCameraState: (newState) =>
    set((state) => ({
      volumeCameraState: {
        ...state.volumeCameraState,
        ...newState,
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

  setShowMetricOverlays: (show) => set({ showMetricOverlays: show }),
});