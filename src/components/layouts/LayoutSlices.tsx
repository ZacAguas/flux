/**
 * Slices Layout Component
 *
 * 1x3 grid layout with only slice views (no 3D volume):
 * - Left: Axial slice view
 * - Center: Coronal slice view
 * - Right: Sagittal slice view
 *
 * Uses ONE Canvas with viewport/scissor rendering to 3 sections.
 */

import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three/webgpu';
import { useViewerStore } from '../../store/viewerStore';
import { createSliceMaterial, updateSliceMaterial } from '../../shaders/sliceShader';
import { InspectorControls } from '../debug/InspectorControls';
import { getSliceDimensions } from '../../utils/layout';

/**
 * Viewport renderer - handles rendering to 3 slice viewports
 */
function ViewportRenderer() {
  const { gl, size } = useThree();
  const volume = useViewerStore((state) => state.volume);
  const volumeTexture = useViewerStore((state) => state.volumeTexture);
  const sliceIndices = useViewerStore((state) => state.sliceIndices);
  const windowLevel = useViewerStore((state) => state.windowLevel);

  // Scenes for each viewport
  const axialSceneRef = useRef<THREE.Scene | undefined>(undefined);
  const coronalSceneRef = useRef<THREE.Scene | undefined>(undefined);
  const sagittalSceneRef = useRef<THREE.Scene | undefined>(undefined);

  // Cameras for each viewport
  const axialCameraRef = useRef<THREE.OrthographicCamera | undefined>(undefined);
  const coronalCameraRef = useRef<THREE.OrthographicCamera | undefined>(undefined);
  const sagittalCameraRef = useRef<THREE.OrthographicCamera | undefined>(undefined);

  // Materials
  const axialMaterialRef = useRef<THREE.MeshBasicNodeMaterial | undefined>(undefined);
  const coronalMaterialRef = useRef<THREE.MeshBasicNodeMaterial | undefined>(undefined);
  const sagittalMaterialRef = useRef<THREE.MeshBasicNodeMaterial | undefined>(undefined);

  // Initialize scenes, cameras, and meshes
  useEffect(() => {
    if (!volumeTexture || !volume) return;

    // Create scenes
    axialSceneRef.current = new THREE.Scene();
    coronalSceneRef.current = new THREE.Scene();
    sagittalSceneRef.current = new THREE.Scene();

    // Get slice dimensions
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

    // Create slice materials
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

    // Create slice meshes
    const axialGeometry = new THREE.PlaneGeometry(axialDims.width, axialDims.height);
    const axialMesh = new THREE.Mesh(axialGeometry, axialMaterialRef.current);
    axialSceneRef.current.add(axialMesh);

    const coronalGeometry = new THREE.PlaneGeometry(coronalDims.width, coronalDims.height);
    const coronalMesh = new THREE.Mesh(coronalGeometry, coronalMaterialRef.current);
    coronalSceneRef.current.add(coronalMesh);

    const sagittalGeometry = new THREE.PlaneGeometry(sagittalDims.width, sagittalDims.height);
    const sagittalMesh = new THREE.Mesh(sagittalGeometry, sagittalMaterialRef.current);
    sagittalSceneRef.current.add(sagittalMesh);

    // Cleanup
    return () => {
      axialGeometry.dispose();
      coronalGeometry.dispose();
      sagittalGeometry.dispose();
      axialMaterialRef.current?.dispose();
      coronalMaterialRef.current?.dispose();
      sagittalMaterialRef.current?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volumeTexture, volume]);

  // Update materials when slice indices or window/level change
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

  // Update camera aspect ratios when viewport size changes
  useEffect(() => {
    if (
      !axialCameraRef.current || !coronalCameraRef.current ||
      !sagittalCameraRef.current || !volume
    ) return;

    const thirdWidth = size.width / 3;
    const height = size.height;
    const viewportAspect = thirdWidth / height;

    const cameras = [
      { cam: axialCameraRef.current, dims: getSliceDimensions(volume, 'axial') },
      { cam: coronalCameraRef.current, dims: getSliceDimensions(volume, 'coronal') },
      { cam: sagittalCameraRef.current, dims: getSliceDimensions(volume, 'sagittal') },
    ];

    cameras.forEach(({ cam, dims }) => {
      const sliceAspect = dims.width / dims.height;
      const isHorizontal = sliceAspect > viewportAspect;

      // Fit to viewport
      const zoomFactor = isHorizontal
        ? dims.width / 2
        : dims.height / 2 * viewportAspect;

      cam.left = -zoomFactor;
      cam.right = zoomFactor;
      cam.top = zoomFactor / viewportAspect;
      cam.bottom = -zoomFactor / viewportAspect;
      cam.updateProjectionMatrix();
    });
  }, [size, volume]);

  // Render to viewports
  useFrame(() => {
    if (
      !axialSceneRef.current || !coronalSceneRef.current ||
      !sagittalSceneRef.current ||
      !axialCameraRef.current || !coronalCameraRef.current ||
      !sagittalCameraRef.current
    ) return;

    const width = size.width;
    const height = size.height;
    const thirdWidth = width / 3;

    // Clear once for the whole canvas
    gl.clear(true, true, true);

    // Render axial (left third)
    gl.setViewport(0, 0, thirdWidth, height);
    gl.setScissor(0, 0, thirdWidth, height);
    gl.setScissorTest(true);
    gl.render(axialSceneRef.current, axialCameraRef.current);

    // Render coronal (center third)
    gl.setViewport(thirdWidth, 0, thirdWidth, height);
    gl.setScissor(thirdWidth, 0, thirdWidth, height);
    gl.render(coronalSceneRef.current, coronalCameraRef.current);

    // Render sagittal (right third)
    gl.setViewport(thirdWidth * 2, 0, thirdWidth, height);
    gl.setScissor(thirdWidth * 2, 0, thirdWidth, height);
    gl.render(sagittalSceneRef.current, sagittalCameraRef.current);

    // Reset scissor test
    gl.setScissorTest(false);
  }, 1); // Manual render, priority 1

  return null;
}

export function LayoutSlices() {
  const controlPanelOpen = useViewerStore((state) => state.controlPanelOpen);
  // HACK: This shouldn't be hardcoded here, but derived from ControlPanel height
  const panelHeight = controlPanelOpen ? 204 : 0;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
    }}>
      <Canvas
        orthographic
        camera={{ zoom: 100, position: [0, 0, 5] }}
        style={{
          position: 'absolute',
          top: `${panelHeight}px`,
          left: 0,
          width: '100%',
          height: `calc(100% - ${panelHeight}px)`,
          transition: 'top 0.3s ease-in-out, height 0.3s ease-in-out',
        }}
        gl={async (props) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const renderer = new THREE.WebGPURenderer(props as any);

          if (import.meta.env.DEV) {
            renderer.inspector = new (await import('three/examples/jsm/inspector/Inspector.js')).Inspector();
          }

          await renderer.init();
          return renderer;
        }}
      >
        <ViewportRenderer />
        <InspectorControls />
      </Canvas>

      {/* Viewport labels */}
      <div style={{
        position: 'absolute',
        top: `${panelHeight + 10}px`,
        left: '10px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        pointerEvents: 'none',
        transition: 'top 0.3s ease-in-out',
      }}>
        Axial
      </div>
      <div style={{
        position: 'absolute',
        top: `${panelHeight + 10}px`,
        left: '33.33%',
        marginLeft: '10px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        pointerEvents: 'none',
        transition: 'top 0.3s ease-in-out',
      }}>
        Coronal
      </div>
      <div style={{
        position: 'absolute',
        top: `${panelHeight + 10}px`,
        left: '66.66%',
        marginLeft: '10px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        pointerEvents: 'none',
        transition: 'top 0.3s ease-in-out',
      }}>
        Sagittal
      </div>

      {/* Vertical dividers */}
      <div style={{
        position: 'absolute',
        top: `${panelHeight}px`,
        bottom: 0,
        left: '33.33%',
        width: '2px',
        backgroundColor: '#333',
        pointerEvents: 'none',
        transition: 'top 0.3s ease-in-out',
      }} />
      <div style={{
        position: 'absolute',
        top: `${panelHeight}px`,
        bottom: 0,
        left: '66.66%',
        width: '2px',
        backgroundColor: '#333',
        pointerEvents: 'none',
        transition: 'top 0.3s ease-in-out',
      }} />
    </div>
  );
}
