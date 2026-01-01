/**
 * Clipping Plane Types
 *
 * Type definitions for anatomical clipping planes in the 3D volume viewer.
 */

export interface ClippingPlane {
  enabled: boolean;
  position: number; // Normalized [0, 1] in volume space
  inverted: boolean; // If true, clip opposite side of plane
}

export interface ClippingPlanes {
  axial: ClippingPlane;
  coronal: ClippingPlane;
  sagittal: ClippingPlane;
}

export interface ClippingPlaneVisualization {
  showPlanes: boolean;
  opacity: number;
  colors: {
    axial: string;
    coronal: string;
    sagittal: string;
  };
}
