import { OrbitControls } from '@react-three/drei';
import { Canvas, extend, type ThreeToJSXElements } from '@react-three/fiber';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import * as THREE from 'three/webgpu';
import './App.css';
import { VolumeRenderer } from './components';
import { FileImport } from './components/FileImport';
import { SliceViewer } from './components/SliceViewer';
import { InspectorControls } from './components/debug/InspectorControls';
import { useViewerStore } from './store/viewerStore';

declare module '@react-three/fiber' {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> { }
}
extend(THREE as any);


function App() {
  const volume = useViewerStore((state) => state.volume);

  return (
    <>
      <Canvas
        orthographic
        camera={{ zoom: 100, position: [0, 0, 5] }}
        gl={async (props) => {
          const renderer = new THREE.WebGPURenderer(props as any);

          if (import.meta.env.DEV) {
            renderer.inspector = new Inspector();
          }

          await renderer.init();

          return renderer;
        }}>
        {volume && (
          <>
            <VolumeRenderer />
            {/* FIX: The slice view here is just for testing  */}
            <group position={[2, 0, 0]}>
              <SliceViewer orientation="axial" />
            </group>

            {import.meta.env.DEV &&
              <InspectorControls />
            }
          </>
        )}
        <OrbitControls />
      </Canvas>

      {!volume &&
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          maxWidth: '500px',
          width: '90%'
        }}>
          <FileImport />
        </div>
      }
    </>
  );
}

export default App;
