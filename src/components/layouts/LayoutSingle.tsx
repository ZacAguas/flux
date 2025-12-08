import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three/webgpu';
import { useViewerStore } from '../../store/viewerStore';
import { VolumeRenderer } from '../../components/VolumeRenderer';
import { InspectorControls } from '../debug/InspectorControls';

export function LayoutSingle() {
  const controlPanelOpen = useViewerStore((state) => state.controlPanelOpen);
  const controlPanelPinned = useViewerStore((state) => state.controlPanelPinned);

  // HACK: This shouldn't be hardcoded here, but derived from ControlPanel height
  const panelHeight = controlPanelOpen && controlPanelPinned ? 204 : 0;
  const labelOffset = controlPanelOpen ? 204 : 0; // Shift labels even when panel is unpinned

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
        <VolumeRenderer />
        <OrbitControls makeDefault enableDamping dampingFactor={0.05} minDistance={2} maxDistance={10} />
        <InspectorControls />
      </Canvas>

      {/* View label */}
      <div style={{
        position: 'absolute',
        top: `${labelOffset + 10}px`,
        left: '10px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        pointerEvents: 'none',
        transition: 'top 0.3s ease-in-out',
      }}>
        3D Volume
      </div>
    </div>
  );
}
