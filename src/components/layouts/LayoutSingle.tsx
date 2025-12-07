/**
 * Single Layout Component
 *
 * Fullscreen 3D volume view with orbit controls.
 * Simpler than LayoutQuad - just one viewport.
 */

import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three/webgpu';
import { useViewerStore } from '../../store/viewerStore';
import { createVolumeRaymarchMaterial } from '../../shaders/volumeRaymarch';
import { InspectorControls } from '../debug/InspectorControls';

/**
 * Volume renderer - renders 3D volume with orbit controls
 */
function VolumeRenderer() {
  const { gl, camera } = useThree();
  const volume = useViewerStore((state) => state.volume);
  const volumeTexture = useViewerStore((state) => state.volumeTexture);

  const sceneRef = useRef<THREE.Scene | undefined>(undefined);
  const volumeMaterialRef = useRef<THREE.MeshBasicNodeMaterial | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(undefined);

  // Initialize scene and volume mesh
  useEffect(() => {
    if (!volumeTexture || !volume) return;

    // Create scene
    sceneRef.current = new THREE.Scene();

    // Create volume material
    volumeMaterialRef.current = createVolumeRaymarchMaterial(volumeTexture, {
      stepSize: 0.01,
      opacity: 1.0,
      threshold: 0.1,
    });

    // Create volume mesh with correct aspect ratio
    const { dimensions, spacing } = volume;
    const scaleX = (dimensions.x * spacing.x) / Math.max(
      dimensions.x * spacing.x,
      dimensions.y * spacing.y,
      dimensions.z * spacing.z
    );
    const scaleY = (dimensions.y * spacing.y) / Math.max(
      dimensions.x * spacing.x,
      dimensions.y * spacing.y,
      dimensions.z * spacing.z
    );
    const scaleZ = (dimensions.z * spacing.z) / Math.max(
      dimensions.x * spacing.x,
      dimensions.y * spacing.y,
      dimensions.z * spacing.z
    );

    const volumeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const volumeMesh = new THREE.Mesh(volumeGeometry, volumeMaterialRef.current);
    volumeMesh.scale.set(scaleX, scaleY, scaleZ);
    sceneRef.current.add(volumeMesh);

    // Cleanup
    return () => {
      volumeGeometry.dispose();
      volumeMaterialRef.current?.dispose();
    };
  }, [volumeTexture, volume]);

  // Setup OrbitControls
  useEffect(() => {
    if (!camera) return;

    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    // PERF: minDistance prevents camera entering volume, avoiding fill rate bottleneck
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controlsRef.current = controls;

    return () => {
      controls.dispose();
    };
  }, [camera, gl]);

  // Render loop
  useFrame(() => {
    if (!sceneRef.current) return;

    // Update controls
    if (controlsRef.current) {
      controlsRef.current.update();
    }

    // Render scene
    gl.render(sceneRef.current, camera);
  }, 1); // Manual render, priority 1

  return null;
}

export function LayoutSingle() {
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
        <VolumeRenderer />
        <InspectorControls />
      </Canvas>

      {/* View label */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        pointerEvents: 'none',
      }}>
        3D Volume
      </div>
    </div>
  );
}
