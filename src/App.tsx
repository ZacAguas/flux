import './App.css'
import * as THREE from 'three/webgpu'
import { Canvas, extend, type ThreeToJSXElements } from '@react-three/fiber'
import { FileImport } from './components/FileImport'

declare module '@react-three/fiber' {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> { }
}
extend(THREE as any)


function App() {

  return (
    <>
      <FileImport onVolumeLoaded={(volume) => { console.log('loaded volume: ', volume) }} />
      <Canvas
        gl={async (props) => {
          const renderer = new THREE.WebGPURenderer(props as any)
          await renderer.init()
          return renderer
        }}>
        <mesh>
          <meshBasicNodeMaterial />
          <boxGeometry />
        </mesh>
      </Canvas>
    </>
  )
}

export default App
