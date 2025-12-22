export type LayoutMode = 'single' | 'slices' | 'quad';

export type SliceOrientation = 'axial' | 'coronal' | 'sagittal';

export interface SliceIndices {
  axial: number;
  coronal: number;
  sagittal: number;
}

export interface WindowLevel {
  center: number;
  width: number;
}

export interface SliceCamera {
  zoom: number;   // 1.0 = fit-to-viewport
  panX: number;   // World space units
  panY: number;   // World space units
}

export interface SliceCameraState {
  axial: SliceCamera;
  coronal: SliceCamera;
  sagittal: SliceCamera;
}
