import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { OrbitControls as StdOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three/webgpu';
import { useViewerStore } from '../../store/viewerStore';
import { useLayoutContext } from '../../context/LayoutContext';
import { ClippingPlaneGizmos } from '../ClippingPlaneGizmos';

interface VolumeDimensions {
  width: number;
  height: number;
  depth: number;
}

interface LayoutRendererProps {
  // Volume Resources
  volumeMesh: THREE.Mesh | null;
  volumeDimensions: VolumeDimensions | null;
  updateCameraUniforms: (camera: THREE.Camera) => void;

  // Clipping Planes (for Gizmos)
  clippingMeshes: {
    axialMesh: THREE.Mesh | undefined;
    coronalMesh: THREE.Mesh | undefined;
    sagittalMesh: THREE.Mesh | undefined;
  };

  // Slice Resources
  sliceScenes: {
    axial: THREE.Scene | undefined;
    coronal: THREE.Scene | undefined;
    sagittal: THREE.Scene | undefined;
  };
  sliceCameras: {
    axial: THREE.OrthographicCamera | undefined;
    coronal: THREE.OrthographicCamera | undefined;
    sagittal: THREE.OrthographicCamera | undefined;
  };
  resizeCameras: (width: number, height: number) => void;
}

// -----------------------------------------------------------------------------
// Single Renderer
// -----------------------------------------------------------------------------
function SingleRenderer({ volumeMesh, volumeDimensions, updateCameraUniforms, clippingMeshes }: LayoutRendererProps) {
  const { scene, gl, size } = useThree();

  // Re-parent mesh and clipping gizmos to default scene
  useEffect(() => {
    if (volumeMesh) scene.add(volumeMesh);
    
    // Add Clipping Gizmos
    if (clippingMeshes.axialMesh) scene.add(clippingMeshes.axialMesh);
    if (clippingMeshes.coronalMesh) scene.add(clippingMeshes.coronalMesh);
    if (clippingMeshes.sagittalMesh) scene.add(clippingMeshes.sagittalMesh);

    return () => {
      if (volumeMesh) scene.remove(volumeMesh);
      
      // Remove Clipping Gizmos
      if (clippingMeshes.axialMesh) scene.remove(clippingMeshes.axialMesh);
      if (clippingMeshes.coronalMesh) scene.remove(clippingMeshes.coronalMesh);
      if (clippingMeshes.sagittalMesh) scene.remove(clippingMeshes.sagittalMesh);
    };
  }, [volumeMesh, clippingMeshes, scene]);

  // Reset GL state when entering this mode or resizing
  // This fixes the issue where switching from Quad/Slices leaves the viewport "stuck"
  useEffect(() => {
    gl.setViewport(0, 0, size.width, size.height);
    gl.setScissor(0, 0, size.width, size.height);
    gl.setScissorTest(false);
  }, [gl, size]);

  useFrame(({ camera }) => {
    updateCameraUniforms(camera);
  });

  if (!volumeMesh || !volumeDimensions) return null;

  return (
    <>
      <ClippingPlaneGizmos
        axialMesh={clippingMeshes.axialMesh}
        coronalMesh={clippingMeshes.coronalMesh}
        sagittalMesh={clippingMeshes.sagittalMesh}
      />
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} minDistance={2} maxDistance={10} />
    </>
  );
}

// -----------------------------------------------------------------------------
// Slices Renderer
// -----------------------------------------------------------------------------
function SlicesRenderer({ sliceScenes, sliceCameras, resizeCameras }: LayoutRendererProps) {
  const { gl, size } = useThree();

  useEffect(() => {
    resizeCameras(size.width / 3, size.height);
  }, [size, resizeCameras]);

  useFrame(() => {
    const { axial: axScene, coronal: corScene, sagittal: sagScene } = sliceScenes;
    const { axial: axCam, coronal: corCam, sagittal: sagCam } = sliceCameras;

    if (!axScene || !corScene || !sagScene || !axCam || !corCam || !sagCam) return;

    const width = size.width;
    const height = size.height;
    const thirdWidth = width / 3;

    gl.clear(true, true, true);

    // Axial (Left)
    gl.setViewport(0, 0, thirdWidth, height);
    gl.setScissor(0, 0, thirdWidth, height);
    gl.setScissorTest(true);
    gl.render(axScene, axCam);

    // Coronal (Center)
    gl.setViewport(thirdWidth, 0, thirdWidth, height);
    gl.setScissor(thirdWidth, 0, thirdWidth, height);
    gl.render(corScene, corCam);

    // Sagittal (Right)
    gl.setViewport(thirdWidth * 2, 0, thirdWidth, height);
    gl.setScissor(thirdWidth * 2, 0, thirdWidth, height);
    gl.render(sagScene, sagCam);

    gl.setScissorTest(false);
  }, 1);

  return null;
}

// -----------------------------------------------------------------------------
// Quad Renderer
// -----------------------------------------------------------------------------
function QuadRenderer(props: LayoutRendererProps) {
  const {
    sliceScenes, sliceCameras, resizeCameras,
    volumeMesh, updateCameraUniforms, clippingMeshes
  } = props;

  const { gl, size } = useThree();
  const { volumeViewportRef } = useLayoutContext();

  // Local Volume Scene & Camera for Quad View
  // We don't use the default R3F scene here to avoid conflicts/overhead
  const volumeSceneRef = useRef(new THREE.Scene());
  const volumeCameraRef = useRef(new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000));
  const controlsRef = useRef<StdOrbitControls | null>(null);

  // Setup Volume Scene
  useEffect(() => {
    volumeCameraRef.current.position.set(0, 0, 5);
  }, []);

  // Re-parent mesh and clipping gizmos to local volume scene
  useEffect(() => {
    const scene = volumeSceneRef.current;
    
    // Add Volume
    if (volumeMesh) scene.add(volumeMesh);
    
    // Add Clipping Gizmos
    if (clippingMeshes.axialMesh) scene.add(clippingMeshes.axialMesh);
    if (clippingMeshes.coronalMesh) scene.add(clippingMeshes.coronalMesh);
    if (clippingMeshes.sagittalMesh) scene.add(clippingMeshes.sagittalMesh);

    return () => {
      // Remove Volume
      if (volumeMesh) scene.remove(volumeMesh);
      
      // Remove Clipping Gizmos
      if (clippingMeshes.axialMesh) scene.remove(clippingMeshes.axialMesh);
      if (clippingMeshes.coronalMesh) scene.remove(clippingMeshes.coronalMesh);
      if (clippingMeshes.sagittalMesh) scene.remove(clippingMeshes.sagittalMesh);
    };
  }, [volumeMesh, clippingMeshes]);

  // Setup OrbitControls attached to the specific viewport DIV
  useEffect(() => {
    if (volumeCameraRef.current && volumeViewportRef.current) {
      const controls = new StdOrbitControls(volumeCameraRef.current, volumeViewportRef.current);
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
    const { axial: axScene, coronal: corScene, sagittal: sagScene } = sliceScenes;
    const { axial: axCam, coronal: corCam, sagittal: sagCam } = sliceCameras;

    if (!axScene || !corScene || !sagScene || !axCam || !corCam || !sagCam) return;

    // Safety check for size
    const width = size.width;
    const height = size.height;
    if (width < 10 || height < 10) return;

    const halfWidth = Math.floor(width / 2);
    const halfHeight = Math.floor(height / 2);

    // Update controls
    if (controlsRef.current) controlsRef.current.update();

    // Update volume uniforms
    updateCameraUniforms(volumeCameraRef.current);

    gl.clear(true, true, true);

    // Axial (Top-Left)
    gl.setViewport(0, 0, halfWidth, halfHeight);
    gl.setScissor(0, 0, halfWidth, halfHeight);
    gl.setScissorTest(true);
    gl.render(axScene, axCam);

    // Coronal (Top-Right)
    gl.setViewport(halfWidth, 0, halfWidth, halfHeight);
    gl.setScissor(halfWidth, 0, halfWidth, halfHeight);
    gl.render(corScene, corCam);

    // Sagittal (Bottom-Left)
    gl.setViewport(0, halfHeight, halfWidth, halfHeight);
    gl.setScissor(0, halfHeight, halfWidth, halfHeight);
    gl.render(sagScene, sagCam);

    // Volume (Bottom-Right)
    gl.setViewport(halfWidth, halfHeight, halfWidth, halfHeight);
    gl.setScissor(halfWidth, halfHeight, halfWidth, halfHeight);
    gl.render(volumeSceneRef.current, volumeCameraRef.current);

    gl.setScissorTest(false);
  }, 1);

  return null;
}

// -----------------------------------------------------------------------------
// Active Renderer (Switcher)
// -----------------------------------------------------------------------------
export function ActiveRenderer(props: LayoutRendererProps) {
  const layoutMode = useViewerStore((state) => state.layoutMode);

  if (layoutMode === 'single') return <SingleRenderer {...props} />;
  if (layoutMode === 'slices') return <SlicesRenderer {...props} />;
  if (layoutMode === 'quad') return <QuadRenderer {...props} />;
  return null;
}
