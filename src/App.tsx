import { extend, type ThreeToJSXElements } from '@react-three/fiber';
import * as THREE from 'three/webgpu';
import './App.css';
import { FileImport } from './components/FileImport';
import { LayoutQuad } from './components/layouts/LayoutQuad';
import { useViewerStore } from './store/viewerStore';

declare module '@react-three/fiber' {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> { }
}
extend(THREE as any);


function App() {
  const volume = useViewerStore((state) => state.volume);

  return (
    <>
      {volume ? (
        <LayoutQuad />
      ) : (
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
      )}
    </>
  );
}

export default App;
