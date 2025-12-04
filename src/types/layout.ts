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
