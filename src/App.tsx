import { extend, type ThreeToJSXElements } from '@react-three/fiber';
import * as THREE from 'three/webgpu';
import './App.css';
import { FileImport } from './components/FileImport';
import { PersistentLayout } from './components/layouts/PersistentLayout';
import { LayoutContextProvider } from './context/LayoutContext';
import { ControlPanel } from './components/ui/ControlPanel';
import { useViewerStore } from './store/viewerStore';

declare module '@react-three/fiber' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> { }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
extend(THREE as any);


function App() {
  const volume = useViewerStore((state) => state.volume);

  return (
    <>
      {volume ? (
        <>
          <LayoutContextProvider>
            <PersistentLayout />
          </LayoutContextProvider>
          <ControlPanel />
        </>
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
