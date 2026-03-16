import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { OrbitControls as StdOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three/webgpu';
import { useViewerStore } from '../../store/viewerStore';
import { useLayoutContext } from '../../context/LayoutContext';
import { CropBoxGizmos } from '../CropBoxGizmos';
import { useSlicePlanesInVolume } from '../../hooks/useSlicePlanesInVolume';

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

  // Crop Box objects (gizmo anchors + wireframe)
  cropBoxMeshes: {
    axialMin: THREE.Object3D | undefined;
    axialMax: THREE.Object3D | undefined;
    coronalMin: THREE.Object3D | undefined;
    coronalMax: THREE.Object3D | undefined;
    sagittalMin: THREE.Object3D | undefined;
    sagittalMax: THREE.Object3D | undefined;
    wireframe: THREE.LineSegments | undefined;
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
function SingleRenderer({ volumeMesh, volumeDimensions, updateCameraUniforms, cropBoxMeshes }: LayoutRendererProps) {
  const { scene, gl, size, camera } = useThree();
  const volumeCameraState = useViewerStore((state) => state.volumeCameraState);
  const setVolumeCameraState = useViewerStore((state) => state.setVolumeCameraState);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  useSlicePlanesInVolume(scene);

  // Restore camera state on mount
  useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;

      // Apply saved state
      camera.position.set(...volumeCameraState.position);
      // Orthographic camera zoom
      if (camera instanceof THREE.OrthographicCamera) {
        camera.zoom = volumeCameraState.zoom;
      }
      camera.updateProjectionMatrix();

      controls.target.set(...volumeCameraState.target);
      controls.update();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Re-parent mesh and crop box objects to default scene
  useEffect(() => {
    if (volumeMesh) scene.add(volumeMesh);

    // Add crop box anchor objects and wireframe
    const objects = [
      cropBoxMeshes.axialMin,
      cropBoxMeshes.axialMax,
      cropBoxMeshes.coronalMin,
      cropBoxMeshes.coronalMax,
      cropBoxMeshes.sagittalMin,
      cropBoxMeshes.sagittalMax,
      cropBoxMeshes.wireframe,
    ];
    for (const obj of objects) {
      if (obj) scene.add(obj);
    }

    return () => {
      if (volumeMesh) scene.remove(volumeMesh);
      for (const obj of objects) {
        if (obj) scene.remove(obj);
      }
    };
  }, [volumeMesh, cropBoxMeshes, scene]);

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
      <CropBoxGizmos
        axialMin={cropBoxMeshes.axialMin}
        axialMax={cropBoxMeshes.axialMax}
        coronalMin={cropBoxMeshes.coronalMin}
        coronalMax={cropBoxMeshes.coronalMax}
        sagittalMin={cropBoxMeshes.sagittalMin}
        sagittalMax={cropBoxMeshes.sagittalMax}
      />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={10}
        onEnd={() => {
          if (controlsRef.current) {
            setVolumeCameraState({
              position: camera.position.toArray() as [number, number, number],
              target: controlsRef.current.target.toArray() as [number, number, number],
              zoom: (camera as THREE.OrthographicCamera).zoom,
            });
          }
        }}
      />
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
    volumeMesh, updateCameraUniforms, cropBoxMeshes
  } = props;

  const { gl, size } = useThree();
  const { volumeViewportRef } = useLayoutContext();
  const volumeCameraState = useViewerStore((state) => state.volumeCameraState);
  const setVolumeCameraState = useViewerStore((state) => state.setVolumeCameraState);

  // Local Volume Scene & Camera for Quad View
  // We don't use the default R3F scene here to avoid conflicts/overhead
  const volumeSceneRef = useRef(new THREE.Scene());
  const volumeCameraRef = useRef(new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000));
  const controlsRef = useRef<StdOrbitControls | null>(null);

  useSlicePlanesInVolume(volumeSceneRef.current);

  // Re-parent mesh and crop box objects to local volume scene
  useEffect(() => {
    const scene = volumeSceneRef.current;

    // Add Volume
    if (volumeMesh) scene.add(volumeMesh);

    // Add crop box anchor objects and wireframe
    const objects = [
      cropBoxMeshes.axialMin,
      cropBoxMeshes.axialMax,
      cropBoxMeshes.coronalMin,
      cropBoxMeshes.coronalMax,
      cropBoxMeshes.sagittalMin,
      cropBoxMeshes.sagittalMax,
      cropBoxMeshes.wireframe,
    ];
    for (const obj of objects) {
      if (obj) scene.add(obj);
    }

    return () => {
      // Remove Volume
      if (volumeMesh) scene.remove(volumeMesh);
      for (const obj of objects) {
        if (obj) scene.remove(obj);
      }
    };
  }, [volumeMesh, cropBoxMeshes]);

  // Setup OrbitControls attached to the specific viewport DIV
  useEffect(() => {
    if (volumeCameraRef.current && volumeViewportRef.current) {
      const controls = new StdOrbitControls(volumeCameraRef.current, volumeViewportRef.current);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

      // Apply saved state
      const cam = volumeCameraRef.current;
      cam.position.set(...volumeCameraState.position);
      cam.zoom = volumeCameraState.zoom;
      cam.updateProjectionMatrix();

      controls.target.set(...volumeCameraState.target);
      controls.update();

      // Listen for changes to save state
      const onEnd = () => {
        setVolumeCameraState({
          position: cam.position.toArray() as [number, number, number],
          target: controls.target.toArray() as [number, number, number],
          zoom: cam.zoom,
        });
      };
      controls.addEventListener('end', onEnd);

      controlsRef.current = controls;
      return () => {
        controls.removeEventListener('end', onEnd);
        controls.dispose();
      };
    }
    // We only want to initialize this once when the viewport element is ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volumeViewportRef]);

  // Resize
  useEffect(() => {
    // Resize slice cameras
    resizeCameras(size.width / 2, size.height / 2);

    // Resize volume camera
    const halfWidth = size.width / 2;
    const halfHeight = size.height / 2;

    const volCam = volumeCameraRef.current;

    // Match R3F default orthographic camera behavior:
    // Frustum units = Screen pixels
    // This ensures that "zoom" has the same meaning (pixels per unit)
    // in both Single (R3F default) and Quad (Manual) views.
    volCam.left = -halfWidth / 2;
    volCam.right = halfWidth / 2;
    volCam.top = halfHeight / 2;
    volCam.bottom = -halfHeight / 2;

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
