import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three/webgpu';
import { useLayoutDimensions } from '../../hooks/useLayoutDimensions';
import { useVolumeSetup } from '../../hooks/useVolumeSetup';
import { useSliceViews } from '../../hooks/useSliceViews';
import { useClippingPlanesInVolume } from '../../hooks/useClippingPlanesInVolume';
import { InspectorControls } from '../debug/InspectorControls';
import { ActiveRenderer } from '../renderers/LayoutRenderers';
import { LayoutOverlays } from '../overlays/LayoutOverlays';

/**
 * SceneResources
 *
 * Lives inside the Canvas.
 * Initializes all Scenes, Cameras, and Meshes ONCE.
 * Passes them down to the ActiveRenderer.
 */
function SceneResources() {
  const { scene } = useThree();

  // 1. Setup Volume Resources
  const { mesh: volumeMesh, updateCameraUniforms, volumeDimensions } = useVolumeSetup();

  // 2. Setup Slice Resources
  const {
    axialScene, coronalScene, sagittalScene,
    axialCamera, coronalCamera, sagittalCamera,
    resizeCameras
  } = useSliceViews();

  // 3. Setup Clipping Gizmos (Meshes)
  // The hook creates the meshes, but ActiveRenderer 
  // parents them to the correct scene (Default vs Local).
  const { axialMesh, coronalMesh, sagittalMesh } = useClippingPlanesInVolume(scene);

  return (
    <ActiveRenderer
      volumeMesh={volumeMesh}
      volumeDimensions={volumeDimensions}
      updateCameraUniforms={updateCameraUniforms}
      clippingMeshes={{ axialMesh, coronalMesh, sagittalMesh }}
      sliceScenes={{ axial: axialScene, coronal: coronalScene, sagittal: sagittalScene }}
      sliceCameras={{ axial: axialCamera, coronal: coronalCamera, sagittal: sagittalCamera }}
      resizeCameras={resizeCameras}
    />
  );
}

/**
 * PersistentLayout
 *
 * The main wrapper that:
 * 1. Holds the permanent WebGPU Canvas
 * 2. Manages the UI overlays
 */
export function PersistentLayout() {
  const { panelHeight } = useLayoutDimensions();

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
          transition: 'top 300ms cubic-bezier(0.4, 0, 0.2, 1), height 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        gl={async (props) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const renderer = new THREE.WebGPURenderer(props as any);
          if (import.meta.env.DEV) {
            const ThreeInspector = await import('three/examples/jsm/inspector/Inspector.js');
            renderer.inspector = new ThreeInspector.Inspector();
          }
          await renderer.init();
          return renderer;
        }}
      >
        <SceneResources />
        <InspectorControls />
      </Canvas>
      <LayoutOverlays />
    </div>
  );
}
