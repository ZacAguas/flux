import { useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three/webgpu';
import { useVolumeSetup } from '../../hooks/useVolumeSetup';
import { useSliceViews } from '../../hooks/useSliceViews';
import { useCropBoxInVolume } from '../../hooks/useCropBoxInVolume';
import { InspectorControls } from '../debug/InspectorControls';
import { ActiveRenderer } from '../renderers/LayoutRenderers';
import { LayoutOverlays } from '../overlays/LayoutOverlays';
import { useThumbnailCapture } from '../../hooks/useThumbnailCapture';
import { useViewerStore } from '../../store/viewerStore';
import { parseNifti } from '../../utils/niftiParser';
import { createVolumeTexture } from '../../utils/volumeTextureConverter';
import { createVolumeReference } from '../../utils/volumeReference';

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

  // 3. Setup Crop Box (Face meshes + wireframe)
  // The hook creates the objects, but ActiveRenderer
  // parents them to the correct scene (Default vs Local).
  const cropBoxMeshes = useCropBoxInVolume(scene);

  const sliceScenes = { axial: axialScene, coronal: coronalScene, sagittal: sagittalScene };
  const sliceCameras = { axial: axialCamera, coronal: coronalCamera, sagittal: sagittalCamera };

  useThumbnailCapture({ volumeMesh, sliceScenes, sliceCameras });

  return (
    <ActiveRenderer
        volumeMesh={volumeMesh}
        volumeDimensions={volumeDimensions}
        updateCameraUniforms={updateCameraUniforms}
        cropBoxMeshes={cropBoxMeshes}
        sliceScenes={sliceScenes}
        sliceCameras={sliceCameras}
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
 * 3. Handles drag-and-drop (Canvas blocks document-level handlers)
 */
export function PersistentLayout() {
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Store state and actions
  const isDirty = useViewerStore((state) => state.isDirty);
  const setVolume = useViewerStore((state) => state.setVolume);
  const clearCurrentSession = useViewerStore((state) => state.clearCurrentSession);
  const setPendingNewVolumeFile = useViewerStore((state) => state.setPendingNewVolumeFile);
  const setShowNewVolumeUnsavedModal = useViewerStore((state) => state.setShowNewVolumeUnsavedModal);

  /**
   * Load a volume file directly (when no unsaved changes).
   */
  const loadVolumeFile = async (file: File) => {
    try {
      const volumeReference = await createVolumeReference(file);
      const metadata = {
        fileName: volumeReference.fileName,
        fileSize: volumeReference.fileSize,
        fileHash: volumeReference.fileHash,
        lastModified: volumeReference.lastModified,
      };

      const volume = await parseNifti(file);
      const texture = createVolumeTexture(volume, 0);

      setVolume(volume, texture, metadata);
      clearCurrentSession();
    } catch (err) {
      console.error('Error loading volume:', err);
    }
  };

  /**
   * Handle new volume file (check dirty state).
   */
  const handleNewVolume = (file: File) => {
    if (isDirty) {
      // Show modal via store state
      setPendingNewVolumeFile(file);
      setShowNewVolumeUnsavedModal(true);
    } else {
      // Load immediately
      loadVolumeFile(file);
    }
  };

  // Drag-and-drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    if (e.dataTransfer?.types.includes('Files')) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) {
      setIsDraggingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer?.types.includes('Files')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length === 0) return;

    const niftiFile = files.find(f => f.name.match(/\.(nii|nii\.gz)$/i));
    if (!niftiFile) return;

    handleNewVolume(niftiFile);
  };

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onDragEnter={handleDragEnter}
    >
      <Canvas
        orthographic
        camera={{ zoom: 100, position: [0, 0, 5] }}
        // NOTE: debounce:0 makes react-use-measure use the immediate (non-debounced) ResizeObserver
        // callback, so R3F updates size every frame during panel open/close animations instead of
        // 50ms after the last resize event (which causes a visible jolt in the 3D content).
        resize={{ debounce: 0 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
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

      {/* Drag-and-drop overlay - appears when dragging files */}
      {isDraggingFile && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 100, 255, 0.1)',
            border: '2px dashed rgba(0, 150, 255, 0.5)',
            pointerEvents: 'auto',
            zIndex: 9999,
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />
      )}
    </div>
  );
}
