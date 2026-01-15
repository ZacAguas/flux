import type * as THREE from 'three';
import type { NiftiVolume } from '../types/nifti';
import type { LayoutMode, SliceIndices, SliceCamera, SliceCameraState, WindowLevel } from '../types/layout';
import type { RaymarchSettings, TransferFunction, TransferFunctionPoint } from '../types/volume';
import type { ClippingPlanes, ClippingPlaneVisualization, ClippingPlane } from '../types/clipping';

// --- Shared/Inner Types ---

export interface VolumeFileMetadata {
  fileName: string;
  fileSize: number;
  fileHash: string;
  lastModified: number;
}

export interface VolumeCameraState {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
}

export interface CrosshairSettings {
  color: string;
  opacity: number;
}

export interface SlicePlaneSettings {
  opacity: number;
  mode: 'textured' | 'colored';
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

export interface ControlPanelSections {
  viewSettings: boolean;
  viewOptions: boolean;
  rendering3D: boolean;
  transferFunction: boolean;
  measurementsTools: boolean;
  presetsSettings: boolean;
}

// --- Slice Interfaces ---

export interface VolumeSlice {
  volume: NiftiVolume | null;
  volumeTexture: THREE.Data3DTexture | null;
  volumeFileMetadata: VolumeFileMetadata | null;
  timeStep: number;
  isLoadingTimeStep: boolean;
  textureCache: Map<number, THREE.Data3DTexture>;

  setVolume: (volume: NiftiVolume, texture: THREE.Data3DTexture, metadata?: VolumeFileMetadata) => void;
  setVolumeTexture: (texture: THREE.Data3DTexture) => void;
  setTimeStep: (step: number) => void;
  setIsLoadingTimeStep: (loading: boolean) => void;
  addTextureToCache: (timeStep: number, texture: THREE.Data3DTexture) => void;
  clearTextureCache: () => void;
}

export interface LayoutSlice {
  layoutMode: LayoutMode;
  controlPanelOpen: boolean;
  controlPanelPinned: boolean;
  controlPanelContentHeight: number;
  controlPanelSections: ControlPanelSections;
  popoverOpen: boolean;

  setLayoutMode: (mode: LayoutMode) => void;
  setControlPanelOpen: (open: boolean) => void;
  setControlPanelPinned: (isPinned: boolean) => void;
  setControlPanelContentHeight: (height: number) => void;
  setControlPanelSectionExpanded: (sectionId: string, expanded: boolean) => void;
  setPopoverOpen: (open: boolean) => void;
  toggleAllSections: (expanded: boolean) => void;
}

export interface ViewSlice {
  sliceIndices: SliceIndices;
  sliceCameraState: SliceCameraState;
  volumeCameraState: VolumeCameraState;
  windowLevel: WindowLevel;
  showCrosshairs: boolean;
  crosshairSettings: CrosshairSettings;
  showMetricOverlays: boolean;

  setSliceIndex: (orientation: keyof SliceIndices, index: number) => void;
  setSliceCamera: (orientation: keyof SliceCameraState, camera: Partial<SliceCamera>) => void;
  resetSliceCamera: (orientation: keyof SliceCameraState) => void;
  resetAllSliceCameras: () => void;
  setVolumeCameraState: (state: Partial<VolumeCameraState>) => void;
  setWindowLevel: (windowLevel: Partial<WindowLevel>) => void;
  setShowCrosshairs: (show: boolean) => void;
  setCrosshairSettings: (settings: Partial<CrosshairSettings>) => void;
  setShowMetricOverlays: (show: boolean) => void;
}

export interface RenderingSlice {
  showSlicePlanes: boolean;
  slicePlaneSettings: SlicePlaneSettings;
  raymarchSettings: RaymarchSettings;
  transferFunction: TransferFunction;
  transferFunctionTexture: THREE.DataTexture | null;
  activeTransferFunctionPreset: string;
  clippingPlanes: ClippingPlanes;
  clippingPlaneVisualization: ClippingPlaneVisualization;

  setShowSlicePlanes: (show: boolean) => void;
  setSlicePlaneSettings: (settings: Partial<SlicePlaneSettings>) => void;
  setRaymarchSettings: (settings: Partial<RaymarchSettings>) => void;
  setTransferFunction: (tf: TransferFunction) => void;
  updateTransferFunctionPoint: (index: number, point: Partial<TransferFunctionPoint>) => void;
  addTransferFunctionPoint: (point: TransferFunctionPoint) => void;
  removeTransferFunctionPoint: (index: number) => void;
  applyTransferFunctionPreset: (presetName: string) => void;
  setTransferFunctionTexture: (texture: THREE.DataTexture | null) => void;
  setClippingPlane: (orientation: keyof ClippingPlanes, plane: Partial<ClippingPlane>) => void;
  setClippingPlaneVisualization: (settings: Partial<ClippingPlaneVisualization>) => void;
  resetClippingPlanes: () => void;
}

// --- Combined Store Type ---

export type ViewerStore = VolumeSlice & LayoutSlice & ViewSlice & RenderingSlice & SessionSlice;

// Import SessionSlice type
import type { SessionSlice } from './slices/sessionSlice';
