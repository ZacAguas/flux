/**
 * Quad Layout Component
 *
 * Displays a 2x2 grid layout:
 * - Top-Left: Axial
 * - Top-Right: Coronal
 * - Bottom-Left: Sagittal
 * - Bottom-Right: 3D Volume
 *
 * Uses manual scissor/viewport management to render multiple views on a single canvas.
 */

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three/webgpu';
import { BaseLayout } from './BaseLayout';
import { useSliceViews } from '../../hooks/useSliceViews';
import { useVolumeSetup } from '../../hooks/useVolumeSetup';
import { useLayoutDimensions } from '../../hooks/useLayoutDimensions';
import { useSlicePlanesInVolume } from '../../hooks/useSlicePlanesInVolume';
import { SliceInteractionHandler } from '../ui/SliceInteractionHandler';
import { Crosshairs } from '../ui/Crosshairs';

/**
 * Internal component to handle the WebGL/WebGPU scissor rendering for the quad view
 */
function QuadRenderer({ volumeViewportRef }: { volumeViewportRef: React.RefObject<HTMLDivElement | null> }) {
  const { gl, size } = useThree();

  // Slice Views
  const { axialScene, coronalScene, sagittalScene,
    axialCamera, coronalCamera, sagittalCamera, resizeCameras } = useSliceViews();

  // Volume View Setup
  const { mesh: volumeMesh, updateCameraUniforms } = useVolumeSetup();
  const volumeSceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const volumeCameraRef = useRef(new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000));

  // Orbit Controls
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(undefined);

  // Setup Volume Scene
  useEffect(() => {
    volumeCameraRef.current.position.set(0, 0, 5);
  }, []);

  useEffect(() => {
    const scene = volumeSceneRef.current;
    if (volumeMesh) scene.add(volumeMesh);
    return () => {
      if (volumeMesh) scene.remove(volumeMesh);
    };
  }, [volumeMesh]);

  // Handle Slice Planes in Volume
  useSlicePlanesInVolume(volumeSceneRef.current);

  // Setup Controls
  useEffect(() => {
    if (volumeCameraRef.current && volumeViewportRef.current) {
      const controls = new OrbitControls(volumeCameraRef.current, volumeViewportRef.current);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controlsRef.current = controls;
      return () => controls.dispose();
    }
  }, [volumeViewportRef]);

  // Resize
  useEffect(() => {
    // Resize slice cameras
    resizeCameras(size.width / 2, size.height / 2);

    // Resize volume camera
    const halfWidth = size.width / 2;
    const halfHeight = size.height / 2;
    const viewportAspect = halfWidth / halfHeight;
    const volCam = volumeCameraRef.current;
    volCam.left = -viewportAspect;
    volCam.right = viewportAspect;
    volCam.top = 1;
    volCam.bottom = -1;
    volCam.updateProjectionMatrix();

  }, [size, resizeCameras]);

  useFrame(() => {
    if (!axialScene || !coronalScene || !sagittalScene ||
      !axialCamera || !coronalCamera || !sagittalCamera) return;

    // Update controls
    if (controlsRef.current) controlsRef.current.update();

    // Update volume uniforms
    updateCameraUniforms(volumeCameraRef.current);

    const halfWidth = size.width / 2;
    const halfHeight = size.height / 2;

    gl.clear(true, true, true);

    // Axial (Top-Left)
    gl.setViewport(0, 0, halfWidth, halfHeight);
    gl.setScissor(0, 0, halfWidth, halfHeight);
    gl.setScissorTest(true);
    gl.render(axialScene, axialCamera);

    // Coronal (Top-Right)
    gl.setViewport(halfWidth, 0, halfWidth, halfHeight);
    gl.setScissor(halfWidth, 0, halfWidth, halfHeight);
    gl.render(coronalScene, coronalCamera);

    // Sagittal (Bottom-Left)
    gl.setViewport(0, halfHeight, halfWidth, halfHeight);
    gl.setScissor(0, halfHeight, halfWidth, halfHeight);
    gl.render(sagittalScene, sagittalCamera);

    // Volume (Bottom-Right)
    gl.setViewport(halfWidth, halfHeight, halfWidth, halfHeight);
    gl.setScissor(halfWidth, halfHeight, halfWidth, halfHeight);
    gl.render(volumeSceneRef.current, volumeCameraRef.current);

    gl.setScissorTest(false);
  }, 1);

  return null;
}

/**
 * Layout showing a 2x2 grid of views.
 */
export function LayoutQuad() {
  const { dimensions, panelHeight, controlPanelOpen } = useLayoutDimensions();
  const labelOffset = controlPanelOpen ? 204 : 0;
  const volumeViewportRef = useRef<HTMLDivElement>(null);

  return (
    <BaseLayout panelHeight={panelHeight} overlays={
      <>
        {/* Volume Viewport Div for OrbitControls */}
        <div
          ref={volumeViewportRef}
          style={{
            position: 'absolute',
            left: '50%',
            top: `calc(50% + ${panelHeight / 2}px)`,
            width: '50%',
            height: '50%',
            pointerEvents: 'auto',
            zIndex: 1,
            transition: 'top 0.3s ease-in-out',
          }}
        />

        {/* Interaction Handler */}
        <SliceInteractionHandler
          layoutMode="quad"
          canvasWidth={dimensions.width}
          canvasHeight={dimensions.height}
          panelHeight={panelHeight}
        />

        {/* Labels */}
        <div style={{ position: 'absolute', top: `${labelOffset + 10}px`, left: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none', transition: 'top 0.3s ease-in-out' }}>Axial</div>
        <div style={{ position: 'absolute', top: `${labelOffset + 10}px`, right: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none', transition: 'top 0.3s ease-in-out' }}>Coronal</div>
        <div style={{ position: 'absolute', top: `calc(50% + ${panelHeight / 2}px)`, left: '10px', marginTop: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none', transition: 'top 0.3s ease-in-out' }}>Sagittal</div>
        <div style={{ position: 'absolute', top: `calc(50% + ${panelHeight / 2}px)`, right: '10px', marginTop: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none', transition: 'top 0.3s ease-in-out' }}>3D Volume</div>

        {/* Grid Lines */}
        <div style={{ position: 'absolute', top: `calc(50% + ${panelHeight / 2}px)`, left: 0, right: 0, height: '2px', backgroundColor: '#333', pointerEvents: 'none', transition: 'top 0.3s ease-in-out' }} />
        <div style={{ position: 'absolute', top: `${panelHeight}px`, bottom: 0, left: '50%', width: '2px', backgroundColor: '#333', pointerEvents: 'none', transition: 'top 0.3s ease-in-out' }} />

        {/* Crosshairs */}
        <Crosshairs
          layoutMode="quad"
          canvasWidth={dimensions.width}
          canvasHeight={dimensions.height}
          panelHeight={panelHeight}
        />
      </>
    }>
      <QuadRenderer volumeViewportRef={volumeViewportRef} />
    </BaseLayout>
  );
}
