/**
 * useThumbnailCapture
 *
 * Registers a thumbnail capture function that works for all layout modes.
 * Renders at thumbnail size to avoid preserveDrawingBuffer overhead.
 */

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three/webgpu';
import { useViewerStore } from '../store/viewerStore';

const THUMBNAIL_WIDTH = 200;

interface UseThumbnailCaptureProps {
  volumeMesh: THREE.Mesh | null;
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
}

function renderViewport(
  renderer: THREE.WebGPURenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  renderer.setViewport(x, y, width, height);
  renderer.setScissor(x, y, width, height);
  renderer.render(scene, camera);
}

export function useThumbnailCapture({
  volumeMesh,
  sliceScenes,
  sliceCameras,
}: UseThumbnailCaptureProps) {
  const { gl, scene, camera, size } = useThree();

  useEffect(() => {
    const captureFunction = (): string | null => {
      try {
        const renderer = gl as unknown as THREE.WebGPURenderer;
        const layoutMode = useViewerStore.getState().layoutMode;

        const aspectRatio = size.height / size.width;
        const thumbWidth = THUMBNAIL_WIDTH;
        const thumbHeight = Math.round(thumbWidth * aspectRatio);

        // Reset scissor to valid rect BEFORE resizing to avoid stale scissor warnings
        renderer.setScissorTest(true);
        renderer.setScissor(0, 0, size.width, size.height);
        renderer.setViewport(0, 0, size.width, size.height);

        renderer.setSize(thumbWidth, thumbHeight, false);
        renderer.setScissor(0, 0, thumbWidth, thumbHeight);
        renderer.setViewport(0, 0, thumbWidth, thumbHeight);
        renderer.setScissorTest(false);

        if (layoutMode === 'single') {
          renderer.render(scene, camera);
        } else if (layoutMode === 'slices') {
          const { axial, coronal, sagittal } = sliceScenes;
          const { axial: axCam, coronal: corCam, sagittal: sagCam } = sliceCameras;

          if (axial && coronal && sagittal && axCam && corCam && sagCam) {
            const w = Math.floor(thumbWidth / 3);

            renderer.setScissorTest(true);
            renderer.clear(true, true, true);

            renderViewport(renderer, axial, axCam, 0, 0, w, thumbHeight);
            renderViewport(renderer, coronal, corCam, w, 0, w, thumbHeight);
            renderViewport(renderer, sagittal, sagCam, w * 2, 0, w, thumbHeight);

            renderer.setScissorTest(false);
          }
        } else if (layoutMode === 'quad') {
          const { axial, coronal, sagittal } = sliceScenes;
          const { axial: axCam, coronal: corCam, sagittal: sagCam } = sliceCameras;

          if (axial && coronal && sagittal && axCam && corCam && sagCam && volumeMesh) {
            const hw = Math.floor(thumbWidth / 2);
            const hh = Math.floor(thumbHeight / 2);

            // Render volumeMesh's parent scene (QuadRenderer's local scene) with scaled camera
            const volumeScene = volumeMesh.parent as THREE.Scene;
            const volumeCameraState = useViewerStore.getState().volumeCameraState;

            const volCam = new THREE.OrthographicCamera(-hw / 2, hw / 2, hh / 2, -hh / 2, 0.1, 1000);
            volCam.position.set(...volumeCameraState.position);
            volCam.zoom = volumeCameraState.zoom * (thumbWidth / size.width);
            volCam.lookAt(...volumeCameraState.target);
            volCam.updateProjectionMatrix();

            renderer.setScissorTest(true);
            renderer.clear(true, true, true);

            renderViewport(renderer, axial, axCam, 0, 0, hw, hh);
            renderViewport(renderer, coronal, corCam, hw, 0, hw, hh);
            renderViewport(renderer, sagittal, sagCam, 0, hh, hw, hh);
            renderViewport(renderer, volumeScene, volCam, hw, hh, hw, hh);

            renderer.setScissorTest(false);
          }
        }

        const dataUrl = renderer.domElement.toDataURL('image/jpeg', 0.5);

        renderer.setSize(size.width, size.height, false);
        renderer.setViewport(0, 0, size.width, size.height);

        return dataUrl;
      } catch (error) {
        console.warn('Thumbnail capture failed:', error);
        return null;
      }
    };

    useViewerStore.getState().setCaptureCanvasThumbnail(captureFunction);
    return () => useViewerStore.getState().setCaptureCanvasThumbnail(null);
  }, [gl, scene, camera, size, volumeMesh, sliceScenes, sliceCameras]);
}
