/**
 * State Serializer
 *
 * Utilities for extracting persistable state from the Zustand store
 * and applying loaded state back to the store.
 */

import type { ViewerStore } from '../store/storeTypes';
import type { SerializableViewerState } from '../types/session';

const CURRENT_VERSION = '1.0.0';

/**
 * Extract all persistable state from the Zustand store.
 * Reads current state synchronously, ignoring any debounced values.
 */
export function serializeViewerState(store: ViewerStore): SerializableViewerState {
  return {
    // Volume metadata
    timeStep: store.timeStep,

    // Layout state
    layoutMode: store.layoutMode,
    controlPanelPinned: store.controlPanelPinned,
    controlPanelSections: { ...store.controlPanelSections },

    // View state
    sliceIndices: { ...store.sliceIndices },
    sliceCameraState: {
      axial: { ...store.sliceCameraState.axial },
      coronal: { ...store.sliceCameraState.coronal },
      sagittal: { ...store.sliceCameraState.sagittal },
    },
    volumeCameraState: {
      position: [...store.volumeCameraState.position],
      target: [...store.volumeCameraState.target],
      zoom: store.volumeCameraState.zoom,
    },
    windowLevel: { ...store.windowLevel },
    showCrosshairs: store.showCrosshairs,
    crosshairSettings: { ...store.crosshairSettings },
    showMetricOverlays: store.showMetricOverlays,

    // Rendering state
    showSlicePlanes: store.showSlicePlanes,
    slicePlaneSettings: {
      ...store.slicePlaneSettings,
      visibility: { ...store.slicePlaneSettings.visibility },
      colors: { ...store.slicePlaneSettings.colors },
    },
    raymarchSettings: { ...store.raymarchSettings },
    transferFunction: {
      ...store.transferFunction,
      points: store.transferFunction.points.map(p => ({
        ...p,
        color: { ...p.color },
      })),
    },
    activeTransferFunctionPreset: store.activeTransferFunctionPreset,
    cropBox: {
      enabled: store.cropBox.enabled,
      axial: { ...store.cropBox.axial },
      coronal: { ...store.cropBox.coronal },
      sagittal: { ...store.cropBox.sagittal },
    },
    // Measurement state (only complete measurements have all points defined)
    measurements: store.measurements
      .filter((m) => m.status === 'complete')
      .map((m) => {
        if (m.type === 'distance') {
          return {
            ...m,
            points: [{ ...m.points[0] }, { ...m.points[1]! }],
          };
        } else {
          return {
            ...m,
            points: [{ ...m.points[0] }, { ...m.points[1]! }, { ...m.points[2]! }],
          };
        }
      }) as typeof store.measurements,
    showMeasurements: store.showMeasurements,
  };
}

/**
 * Apply serialized state to the Zustand store.
 * Updates all persistable state properties.
 *
 * NOTE: This does NOT restore the volume or textures - those must be
 * loaded separately via the existing file loading pipeline.
 */
export function deserializeViewerState(
  state: SerializableViewerState,
  store: ViewerStore,
): void {
  // Layout state
  store.setLayoutMode(state.layoutMode);
  store.setControlPanelPinned(state.controlPanelPinned);

  // Restore control panel sections
  Object.entries(state.controlPanelSections).forEach(([sectionId, expanded]) => {
    store.setControlPanelSectionExpanded(sectionId, expanded);
  });

  // View state - slices
  Object.entries(state.sliceIndices).forEach(([orientation, index]) => {
    store.setSliceIndex(orientation as keyof typeof state.sliceIndices, index);
  });

  // View state - slice cameras
  Object.entries(state.sliceCameraState).forEach(([orientation, camera]) => {
    store.setSliceCamera(orientation as keyof typeof state.sliceCameraState, camera);
  });

  // View state - volume camera
  store.setVolumeCameraState(state.volumeCameraState);

  // View state - window/level
  store.setWindowLevel(state.windowLevel);

  // View state - crosshairs
  store.setShowCrosshairs(state.showCrosshairs);
  store.setCrosshairSettings(state.crosshairSettings);

  // View state - overlays
  store.setShowMetricOverlays(state.showMetricOverlays);

  // Rendering state - slice planes
  store.setShowSlicePlanes(state.showSlicePlanes);
  store.setSlicePlaneSettings(state.slicePlaneSettings);

  // Rendering state - raymarching
  store.setRaymarchSettings(state.raymarchSettings);

  // Rendering state - transfer function
  store.setTransferFunction(state.transferFunction);
  if (state.activeTransferFunctionPreset !== 'custom') {
    // If a preset was active, reapply it to ensure consistency
    store.applyTransferFunctionPreset(state.activeTransferFunctionPreset);
  }

  // Rendering state - crop box
  store.setCropBox(state.cropBox);

  // Measurement state
  if (state.measurements) {
    store.setMeasurements(state.measurements);
  }
  if (state.showMeasurements !== undefined) {
    store.setShowMeasurements(state.showMeasurements);
  }

  // NOTE: timeStep is handled separately during volume loading
}

/**
 * Validate session version compatibility.
 * Returns true if the session can be loaded.
 */
export function validateSessionVersion(version: string): boolean {
  const [major] = version.split('.').map(Number);
  const [currentMajor] = CURRENT_VERSION.split('.').map(Number);

  // Can load if major versions match (backward compatible within major version)
  return major === currentMajor;
}

/**
 * Get the current schema version.
 */
export function getCurrentVersion(): string {
  return CURRENT_VERSION;
}

/**
 * Migrate state from older versions if needed.
 * Currently a no-op (only one version exists).
 * Future versions can add migration logic here.
 */
export function migrateStateIfNeeded(
  state: SerializableViewerState,
): SerializableViewerState {
  // TODO: Add migration logic when schema changes
  // Example:
  // if (fromVersion === '1.0.0') {
  //   return migrate_1_0_0_to_1_1_0(state);
  // }
  return state;
}
