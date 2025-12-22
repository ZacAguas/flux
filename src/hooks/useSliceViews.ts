/**
 * Slice Views Hook
 *
 * Manages the 2D slice views (Axial, Coronal, Sagittal).
 * Handles:
 * - Scene and Camera creation for each view
 * - Material creation and updates for slice rendering
 * - Camera resizing logic to fit viewports
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three/webgpu';
import { useViewerStore } from '../store/viewerStore';
import { createSliceMaterial, updateSliceMaterial } from '../shaders/sliceShader';
import { getSliceDimensions } from '../utils/layout';

/**
 * Custom hook to manage the setup and updates of the three orthogonal slice views.
 *
 * @returns Object containing scenes, cameras, and a resize helper function.
 */
export function useSliceViews() {
  const volume = useViewerStore((state) => state.volume);
  const volumeTexture = useViewerStore((state) => state.volumeTexture);
  const sliceIndices = useViewerStore((state) => state.sliceIndices);
  const sliceCameraState = useViewerStore((state) => state.sliceCameraState);
  const windowLevel = useViewerStore((state) => state.windowLevel);

  // Scenes
  const axialSceneRef = useRef<THREE.Scene | undefined>(undefined);
  const coronalSceneRef = useRef<THREE.Scene | undefined>(undefined);
  const sagittalSceneRef = useRef<THREE.Scene | undefined>(undefined);

  // Cameras
  const axialCameraRef = useRef<THREE.OrthographicCamera | undefined>(undefined);
  const coronalCameraRef = useRef<THREE.OrthographicCamera | undefined>(undefined);
  const sagittalCameraRef = useRef<THREE.OrthographicCamera | undefined>(undefined);

  // Materials
  const axialMaterialRef = useRef<THREE.MeshBasicNodeMaterial | undefined>(undefined);
  const coronalMaterialRef = useRef<THREE.MeshBasicNodeMaterial | undefined>(undefined);
  const sagittalMaterialRef = useRef<THREE.MeshBasicNodeMaterial | undefined>(undefined);

  // Track last viewport dimensions for camera updates
  const lastViewportDimsRef = useRef<{ width: number; height: number } | null>(null);

  // Initialize
  useEffect(() => {
    if (!volumeTexture || !volume) return;

    // Create scenes
    axialSceneRef.current = new THREE.Scene();
    coronalSceneRef.current = new THREE.Scene();
    sagittalSceneRef.current = new THREE.Scene();

    // Dimensions
    const axialDims = getSliceDimensions(volume, 'axial');
    const coronalDims = getSliceDimensions(volume, 'coronal');
    const sagittalDims = getSliceDimensions(volume, 'sagittal');

    // Create cameras
    axialCameraRef.current = new THREE.OrthographicCamera(
      -axialDims.width / 2, axialDims.width / 2,
      axialDims.height / 2, -axialDims.height / 2,
      0.1, 1000
    );
    axialCameraRef.current.position.set(0, 0, 5);

    coronalCameraRef.current = new THREE.OrthographicCamera(
      -coronalDims.width / 2, coronalDims.width / 2,
      coronalDims.height / 2, -coronalDims.height / 2,
      0.1, 1000
    );
    coronalCameraRef.current.position.set(0, 0, 5);

    sagittalCameraRef.current = new THREE.OrthographicCamera(
      -sagittalDims.width / 2, sagittalDims.width / 2,
      sagittalDims.height / 2, -sagittalDims.height / 2,
      0.1, 1000
    );
    sagittalCameraRef.current.position.set(0, 0, 5);

    // Create materials
    const range = volume.dataRange.max - volume.dataRange.min;
    const normalizedCenter = (windowLevel.center - volume.dataRange.min) / range;
    const normalizedWidth = windowLevel.width / range;

    axialMaterialRef.current = createSliceMaterial(
      volumeTexture, 'axial', sliceIndices.axial, volume.dimensions,
      normalizedCenter, normalizedWidth
    );
    coronalMaterialRef.current = createSliceMaterial(
      volumeTexture, 'coronal', sliceIndices.coronal, volume.dimensions,
      normalizedCenter, normalizedWidth
    );
    sagittalMaterialRef.current = createSliceMaterial(
      volumeTexture, 'sagittal', sliceIndices.sagittal, volume.dimensions,
      normalizedCenter, normalizedWidth
    );

    // Create meshes
    const axialGeometry = new THREE.PlaneGeometry(axialDims.width, axialDims.height);
    const axialMesh = new THREE.Mesh(axialGeometry, axialMaterialRef.current);
    axialSceneRef.current.add(axialMesh);

    const coronalGeometry = new THREE.PlaneGeometry(coronalDims.width, coronalDims.height);
    const coronalMesh = new THREE.Mesh(coronalGeometry, coronalMaterialRef.current);
    coronalSceneRef.current.add(coronalMesh);

    const sagittalGeometry = new THREE.PlaneGeometry(sagittalDims.width, sagittalDims.height);
    const sagittalMesh = new THREE.Mesh(sagittalGeometry, sagittalMaterialRef.current);
    sagittalSceneRef.current.add(sagittalMesh);

    return () => {
      axialGeometry.dispose();
      coronalGeometry.dispose();
      sagittalGeometry.dispose();
      axialMaterialRef.current?.dispose();
      coronalMaterialRef.current?.dispose();
      sagittalMaterialRef.current?.dispose();
    };
    // NOTE: windowLevel and sliceIndices are intentionally excluded to avoid full init on options change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volumeTexture, volume]);

  // Update materials
  useEffect(() => {
    if (!volume || !axialMaterialRef.current || !coronalMaterialRef.current || !sagittalMaterialRef.current) return;

    const range = volume.dataRange.max - volume.dataRange.min;
    const normalizedCenter = (windowLevel.center - volume.dataRange.min) / range;
    const normalizedWidth = windowLevel.width / range;

    updateSliceMaterial(axialMaterialRef.current, {
      sliceIndex: sliceIndices.axial,
      windowCenter: normalizedCenter,
      windowWidth: normalizedWidth,
    });
    updateSliceMaterial(coronalMaterialRef.current, {
      sliceIndex: sliceIndices.coronal,
      windowCenter: normalizedCenter,
      windowWidth: normalizedWidth,
    });
    updateSliceMaterial(sagittalMaterialRef.current, {
      sliceIndex: sliceIndices.sagittal,
      windowCenter: normalizedCenter,
      windowWidth: normalizedWidth,
    });
  }, [sliceIndices, windowLevel, volume]);

  // Helper to resize cameras
  const resizeCameras = (viewportWidth: number, viewportHeight: number) => {
    if (!volume || !axialCameraRef.current || !coronalCameraRef.current || !sagittalCameraRef.current) return;

    // Store viewport dimensions for camera state updates
    lastViewportDimsRef.current = { width: viewportWidth, height: viewportHeight };

    const viewportAspect = viewportWidth / viewportHeight;
    const cameras = [
      { cam: axialCameraRef.current, dims: getSliceDimensions(volume, 'axial'), cameraState: sliceCameraState.axial },
      { cam: coronalCameraRef.current, dims: getSliceDimensions(volume, 'coronal'), cameraState: sliceCameraState.coronal },
      { cam: sagittalCameraRef.current, dims: getSliceDimensions(volume, 'sagittal'), cameraState: sliceCameraState.sagittal },
    ];

    cameras.forEach(({ cam, dims, cameraState }) => {
      const sliceAspect = dims.width / dims.height;
      const isHorizontal = sliceAspect > viewportAspect;
      const baseZoomFactor = isHorizontal ? dims.width / 2 : dims.height / 2 * viewportAspect;

      // Apply user zoom (smaller frustum = zoomed in)
      const zoomFactor = baseZoomFactor / cameraState.zoom;

      // Apply pan offset to frustum
      cam.left = -zoomFactor + cameraState.panX;
      cam.right = zoomFactor + cameraState.panX;
      cam.top = zoomFactor / viewportAspect + cameraState.panY;
      cam.bottom = -zoomFactor / viewportAspect + cameraState.panY;
      cam.updateProjectionMatrix();
    });
  };

  // Update cameras when camera state changes
  useEffect(() => {
    if (lastViewportDimsRef.current) {
      resizeCameras(lastViewportDimsRef.current.width, lastViewportDimsRef.current.height);
    }
    // NOTE: resizeCameras is excluded as it's recreated on each render (React Compiler handles memoization)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliceCameraState]);

  return {
    axialScene: axialSceneRef.current,
    coronalScene: coronalSceneRef.current,
    sagittalScene: sagittalSceneRef.current,
    axialCamera: axialCameraRef.current,
    coronalCamera: coronalCameraRef.current,
    sagittalCamera: sagittalCameraRef.current,
    resizeCameras
  };
}
