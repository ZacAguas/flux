import './App.css';
import * as THREE from 'three/webgpu';
import { Canvas, extend, type ThreeToJSXElements } from '@react-three/fiber';
import { FileImport } from './components/FileImport';
import type { NiftiVolume } from './types';
import { useState } from 'react';
import { VolumeRenderer } from './components';
import { OrbitControls } from '@react-three/drei';

declare module '@react-three/fiber' {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> { }
}
extend(THREE as any);


function App() {
  const [volume, setVolume] = useState<NiftiVolume | null>(null);
  function onVolumeLoaded(volume: NiftiVolume) {
    setVolume(volume);
  }

  return (
    <>
      <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}>
        <Canvas
          orthographic
          camera={{ zoom: 100, position: [0, 0, 5] }}
          gl={async (props) => {
            const renderer = new THREE.WebGPURenderer(props as any);
            await renderer.init();
            return renderer;
          }}>
          {volume &&
            <VolumeRenderer volume={volume} />
          }
          <OrbitControls />
        </Canvas>
      </div>
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
          <FileImport onVolumeLoaded={onVolumeLoaded} />
        </div>
      }
    </>
  );
}

export default App;
