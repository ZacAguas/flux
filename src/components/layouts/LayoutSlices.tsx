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

    // Create cameras
    // NOTE: Initial aspect=1, updated dynamically based on window size
    const aspect = 1;
    const frustumSize = 2;
    axialCameraRef.current = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2, frustumSize * aspect / 2,
      frustumSize / 2, -frustumSize / 2,
      0.1, 1000
    );
    axialCameraRef.current.position.set(0, 0, 5);

    coronalCameraRef.current = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2, frustumSize * aspect / 2,
      frustumSize / 2, -frustumSize / 2,
      0.1, 1000
    );
    coronalCameraRef.current.position.set(0, 0, 5);

    sagittalCameraRef.current = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2, frustumSize * aspect / 2,
      frustumSize / 2, -frustumSize / 2,
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
    const axialGeometry = new THREE.PlaneGeometry(1, 1);
    const axialMesh = new THREE.Mesh(axialGeometry, axialMaterialRef.current);
    axialSceneRef.current.add(axialMesh);

    const coronalGeometry = new THREE.PlaneGeometry(1, 1);
    const coronalMesh = new THREE.Mesh(coronalGeometry, coronalMaterialRef.current);
    coronalSceneRef.current.add(coronalMesh);

    const sagittalGeometry = new THREE.PlaneGeometry(1, 1);
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
      !sagittalCameraRef.current
    ) return;

    const thirdWidth = size.width / 3;
    const height = size.height;
    const viewportAspect = thirdWidth / height;
    const frustumSize = 2;

    // Update all camera projections to match viewport aspect ratio
    [axialCameraRef.current, coronalCameraRef.current, sagittalCameraRef.current].forEach(camera => {
      camera.left = -frustumSize * viewportAspect / 2;
      camera.right = frustumSize * viewportAspect / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();
    });
  }, [size]);

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
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        orthographic
        camera={{ zoom: 100, position: [0, 0, 5] }}
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
        top: '10px',
        left: '10px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        pointerEvents: 'none',
      }}>
        Axial
      </div>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '33.33%',
        marginLeft: '10px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        pointerEvents: 'none',
      }}>
        Coronal
      </div>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '66.66%',
        marginLeft: '10px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        pointerEvents: 'none',
      }}>
        Sagittal
      </div>

      {/* Vertical dividers */}
      <div style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '33.33%',
        width: '2px',
        backgroundColor: '#333',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '66.66%',
        width: '2px',
        backgroundColor: '#333',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
