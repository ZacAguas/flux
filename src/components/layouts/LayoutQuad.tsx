/**
 * Quad Layout Component (Option B: Single Canvas with Viewports)
 *
 * 2x2 grid layout with:
 * - Top-left: Axial slice view
 * - Top-right: Coronal slice view
 * - Bottom-left: Sagittal slice view
 * - Bottom-right: 3D volume view
 *
 * Uses ONE Canvas with viewport/scissor rendering to 4 quadrants.
 * Based on webgpu_multiple_elements.html example pattern.
 */

import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three/webgpu';
import { useViewerStore } from '../../store/viewerStore';
import { createSliceMaterial, updateSliceMaterial } from '../../shaders/sliceShader';
import {
  createVolumeRaymarchMaterial,
  updateRaymarchCameraUniforms,
  updateRaymarchMeshUniforms,
  updateRaymarchUniforms,
} from '../../shaders/volumeRaymarch';
import { InspectorControls } from '../debug/InspectorControls';
import { getSliceDimensions, getVolumeDimensions } from '../../utils/layout';
import { Crosshairs } from '../ui/Crosshairs';
import { SliceInteractionHandler } from '../ui/SliceInteractionHandler';
import {
  calculateSlicePlanePosition,
  calculateSlicePlaneScale,
  createTexturedSlicePlaneMaterial,
  createColoredSlicePlaneMaterial,
} from '../../utils/slicePlaneHelpers';

/**
 * Viewport renderer - handles rendering to 4 viewports
 */
function ViewportRenderer({ volumeViewportRef }: { volumeViewportRef: React.RefObject<HTMLDivElement | null> }) {
  const { gl, size } = useThree();
  const volume = useViewerStore((state) => state.volume);
  const volumeTexture = useViewerStore((state) => state.volumeTexture);
  const sliceIndices = useViewerStore((state) => state.sliceIndices);
  const windowLevel = useViewerStore((state) => state.windowLevel);
  const raymarchSettings = useViewerStore((state) => state.raymarchSettings);
  const showSlicePlanes = useViewerStore((state) => state.showSlicePlanes);
  const slicePlaneSettings = useViewerStore((state) => state.slicePlaneSettings);

  // Scenes for each viewport
  const axialSceneRef = useRef<THREE.Scene | undefined>(undefined);
  const coronalSceneRef = useRef<THREE.Scene | undefined>(undefined);
  const sagittalSceneRef = useRef<THREE.Scene | undefined>(undefined);
  const volumeSceneRef = useRef<THREE.Scene | undefined>(undefined);

  // Cameras for each viewport
  const axialCameraRef = useRef<THREE.OrthographicCamera | undefined>(undefined);
  const coronalCameraRef = useRef<THREE.OrthographicCamera | undefined>(undefined);
  const sagittalCameraRef = useRef<THREE.OrthographicCamera | undefined>(undefined);
  const volumeCameraRef = useRef<THREE.OrthographicCamera | undefined>(undefined);

  // Controls for 3D volume view
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(undefined);

  // Volume Mesh
  const volumeMeshRef = useRef<THREE.Mesh | undefined>(undefined);

  // Materials
  const axialMaterialRef = useRef<THREE.MeshBasicNodeMaterial | undefined>(undefined);
  const coronalMaterialRef = useRef<THREE.MeshBasicNodeMaterial | undefined>(undefined);
  const sagittalMaterialRef = useRef<THREE.MeshBasicNodeMaterial | undefined>(undefined);
  const volumeMaterialRef = useRef<THREE.MeshBasicNodeMaterial | undefined>(undefined);

  // Slice plane meshes
  const axialPlaneMeshRef = useRef<THREE.Mesh | undefined>(undefined);
  const coronalPlaneMeshRef = useRef<THREE.Mesh | undefined>(undefined);
  const sagittalPlaneMeshRef = useRef<THREE.Mesh | undefined>(undefined);

  // Slice plane materials
  const axialPlaneMaterialRef = useRef<THREE.MeshBasicNodeMaterial | undefined>(undefined);
  const coronalPlaneMaterialRef = useRef<THREE.MeshBasicNodeMaterial | undefined>(undefined);
  const sagittalPlaneMaterialRef = useRef<THREE.MeshBasicNodeMaterial | undefined>(undefined);

  // Initialize scenes, cameras, and meshes
  useEffect(() => {
    if (!volumeTexture || !volume) return;

    // Create scenes
    axialSceneRef.current = new THREE.Scene();
    coronalSceneRef.current = new THREE.Scene();
    sagittalSceneRef.current = new THREE.Scene();
    volumeSceneRef.current = new THREE.Scene();

    // Get slice dimensions
    const axialDims = getSliceDimensions(volume, 'axial');
    const coronalDims = getSliceDimensions(volume, 'coronal');
    const sagittalDims = getSliceDimensions(volume, 'sagittal');

    // Create cameras
    axialCameraRef.current = new THREE.OrthographicCamera(
      -axialDims.width / 2, axialDims.width / 2,
      axialDims.height / 2, -axialDims.height / 2,
      0.1, 1000
    );
    axialCameraRef.current.position.set(0, 0, 5);

    coronalCameraRef.current = new THREE.OrthographicCamera(
      -coronalDims.width / 2, coronalDims.width / 2,
      coronalDims.height / 2, -coronalDims.height / 2,
      0.1, 1000
    );
    coronalCameraRef.current.position.set(0, 0, 5);

    sagittalCameraRef.current = new THREE.OrthographicCamera(
      -sagittalDims.width / 2, sagittalDims.width / 2,
      sagittalDims.height / 2, -sagittalDims.height / 2,
      0.1, 1000
    );
    sagittalCameraRef.current.position.set(0, 0, 5);

    volumeCameraRef.current = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    volumeCameraRef.current.position.set(0, 0, 5);

    // Create slice materials
    const range = volume.dataRange.max - volume.dataRange.min;
    const normalizedCenter = (windowLevel.center - volume.dataRange.min) / range;
    const normalizedWidth = windowLevel.width / range;

    axialMaterialRef.current = createSliceMaterial(
      volumeTexture, 'axial', sliceIndices.axial, volume.dimensions,
      normalizedCenter, normalizedWidth
    );
    coronalMaterialRef.current = createSliceMaterial(
      volumeTexture, 'coronal', sliceIndices.coronal, volume.dimensions,
      normalizedCenter, normalizedWidth
    );
    sagittalMaterialRef.current = createSliceMaterial(
      volumeTexture, 'sagittal', sliceIndices.sagittal, volume.dimensions,
      normalizedCenter, normalizedWidth
    );

    // Create volume material
    volumeMaterialRef.current = createVolumeRaymarchMaterial(volumeTexture, {
      stepSize: raymarchSettings.stepSize,
      opacity: raymarchSettings.opacity,
      threshold: raymarchSettings.threshold,
    });

    // Create slice meshes
    const axialGeometry = new THREE.PlaneGeometry(axialDims.width, axialDims.height);
    const axialMesh = new THREE.Mesh(axialGeometry, axialMaterialRef.current);
    axialSceneRef.current.add(axialMesh);

    const coronalGeometry = new THREE.PlaneGeometry(coronalDims.width, coronalDims.height);
    const coronalMesh = new THREE.Mesh(coronalGeometry, coronalMaterialRef.current);
    coronalSceneRef.current.add(coronalMesh);

    const sagittalGeometry = new THREE.PlaneGeometry(sagittalDims.width, sagittalDims.height);
    const sagittalMesh = new THREE.Mesh(sagittalGeometry, sagittalMaterialRef.current);
    sagittalSceneRef.current.add(sagittalMesh);

    // Create volume mesh
    const volDims = getVolumeDimensions(volume);
    const volumeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const volumeMesh = new THREE.Mesh(volumeGeometry, volumeMaterialRef.current);
    volumeMesh.scale.set(volDims.width, volDims.height, volDims.depth);
    volumeSceneRef.current.add(volumeMesh);
    volumeMeshRef.current = volumeMesh; // Store mesh ref

    // Update mesh related uniforms once per setup
    updateRaymarchMeshUniforms(volumeMaterialRef.current, volumeMesh);

    // Create slice plane geometries and materials (textured with actual slice data)
    const volDimsNormalized = getVolumeDimensions(volume);

    // Axial plane (XY, positioned on Z)
    const axialPlaneScale = calculateSlicePlaneScale('axial', volDimsNormalized);
    const axialPlaneGeometry = new THREE.PlaneGeometry(1, 1);
    axialPlaneMaterialRef.current =
      slicePlaneSettings.mode === 'textured'
        ? createTexturedSlicePlaneMaterial(
            volumeTexture,
            'axial',
            sliceIndices.axial,
            volume.dimensions,
            normalizedCenter,
            normalizedWidth,
            slicePlaneSettings.opacity
          )
        : createColoredSlicePlaneMaterial(
            slicePlaneSettings.colors.axial,
            slicePlaneSettings.opacity
          );
    const axialPlaneMesh = new THREE.Mesh(axialPlaneGeometry, axialPlaneMaterialRef.current);
    axialPlaneMesh.scale.set(axialPlaneScale.width, axialPlaneScale.height, 1);
    axialPlaneMesh.rotation.set(0, 0, 0); // XY orientation
    axialPlaneMesh.visible = showSlicePlanes && slicePlaneSettings.visibility.axial;
    volumeSceneRef.current.add(axialPlaneMesh);
    axialPlaneMeshRef.current = axialPlaneMesh;

    // Coronal plane (XZ, positioned on Y)
    const coronalPlaneScale = calculateSlicePlaneScale('coronal', volDimsNormalized);
    const coronalPlaneGeometry = new THREE.PlaneGeometry(1, 1);
    coronalPlaneMaterialRef.current =
      slicePlaneSettings.mode === 'textured'
        ? createTexturedSlicePlaneMaterial(
            volumeTexture,
            'coronal',
            sliceIndices.coronal,
            volume.dimensions,
            normalizedCenter,
            normalizedWidth,
            slicePlaneSettings.opacity
          )
        : createColoredSlicePlaneMaterial(
            slicePlaneSettings.colors.coronal,
            slicePlaneSettings.opacity
          );
    const coronalPlaneMesh = new THREE.Mesh(coronalPlaneGeometry, coronalPlaneMaterialRef.current);
    coronalPlaneMesh.scale.set(coronalPlaneScale.width, coronalPlaneScale.height, 1);
    coronalPlaneMesh.rotation.set(Math.PI / 2, 0, 0); // Rotate to XZ
    coronalPlaneMesh.visible = showSlicePlanes && slicePlaneSettings.visibility.coronal;
    volumeSceneRef.current.add(coronalPlaneMesh);
    coronalPlaneMeshRef.current = coronalPlaneMesh;

    // Sagittal plane (YZ, positioned on X)
    const sagittalPlaneScale = calculateSlicePlaneScale('sagittal', volDimsNormalized);
    const sagittalPlaneGeometry = new THREE.PlaneGeometry(1, 1);
    sagittalPlaneMaterialRef.current =
      slicePlaneSettings.mode === 'textured'
        ? createTexturedSlicePlaneMaterial(
            volumeTexture,
            'sagittal',
            sliceIndices.sagittal,
            volume.dimensions,
            normalizedCenter,
            normalizedWidth,
            slicePlaneSettings.opacity
          )
        : createColoredSlicePlaneMaterial(
            slicePlaneSettings.colors.sagittal,
            slicePlaneSettings.opacity
          );
    const sagittalPlaneMesh = new THREE.Mesh(sagittalPlaneGeometry, sagittalPlaneMaterialRef.current);
    sagittalPlaneMesh.scale.set(sagittalPlaneScale.width, sagittalPlaneScale.height, 1);
    sagittalPlaneMesh.rotation.set(0, Math.PI / 2, +Math.PI / 2); // Rotate to YZ with correct UV orientation
    sagittalPlaneMesh.visible = showSlicePlanes && slicePlaneSettings.visibility.sagittal;
    volumeSceneRef.current.add(sagittalPlaneMesh);
    sagittalPlaneMeshRef.current = sagittalPlaneMesh;

    // Calculate and set initial positions
    const axialPos = calculateSlicePlanePosition(sliceIndices.axial, 'axial', volume);
    const coronalPos = calculateSlicePlanePosition(sliceIndices.coronal, 'coronal', volume);
    const sagittalPos = calculateSlicePlanePosition(sliceIndices.sagittal, 'sagittal', volume);

    const maxDim = Math.max(
      volume.dimensions.x * volume.spacing.x,
      volume.dimensions.y * volume.spacing.y,
      volume.dimensions.z * volume.spacing.z
    );

    axialPlaneMesh.position.set(0, 0, axialPos / maxDim);
    coronalPlaneMesh.position.set(0, coronalPos / maxDim, 0);
    sagittalPlaneMesh.position.set(sagittalPos / maxDim, 0, 0);

    // Cleanup
    return () => {
      axialGeometry.dispose();
      coronalGeometry.dispose();
      sagittalGeometry.dispose();
      volumeGeometry.dispose();
      axialMaterialRef.current?.dispose();
      coronalMaterialRef.current?.dispose();
      sagittalMaterialRef.current?.dispose();
      volumeMaterialRef.current?.dispose();
      axialPlaneGeometry.dispose();
      coronalPlaneGeometry.dispose();
      sagittalPlaneGeometry.dispose();
      axialPlaneMaterialRef.current?.dispose();
      coronalPlaneMaterialRef.current?.dispose();
      sagittalPlaneMaterialRef.current?.dispose();
    };
    // NOTE: We don't want to recreate everything on every slice/window change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volumeTexture, volume]);

  // Update materials when slice indices or window/level change
  useEffect(() => {
    if (!volume || !axialMaterialRef.current || !coronalMaterialRef.current || !sagittalMaterialRef.current) return;

    const range = volume.dataRange.max - volume.dataRange.min;
    const normalizedCenter = (windowLevel.center - volume.dataRange.min) / range;
    const normalizedWidth = windowLevel.width / range;

    updateSliceMaterial(axialMaterialRef.current, {
      sliceIndex: sliceIndices.axial,
      windowCenter: normalizedCenter,
      windowWidth: normalizedWidth,
    });
    updateSliceMaterial(coronalMaterialRef.current, {
      sliceIndex: sliceIndices.coronal,
      windowCenter: normalizedCenter,
      windowWidth: normalizedWidth,
    });
    updateSliceMaterial(sagittalMaterialRef.current, {
      sliceIndex: sliceIndices.sagittal,
      windowCenter: normalizedCenter,
      windowWidth: normalizedWidth,
    });
  }, [sliceIndices, windowLevel, volume]);

  // Update slice plane positions and textures when slice indices change
  useEffect(() => {
    if (!volume || !axialPlaneMeshRef.current ||
      !coronalPlaneMeshRef.current || !sagittalPlaneMeshRef.current) return;
    if (!axialPlaneMaterialRef.current || !coronalPlaneMaterialRef.current ||
      !sagittalPlaneMaterialRef.current) return;

    // Update positions
    const axialPos = calculateSlicePlanePosition(sliceIndices.axial, 'axial', volume);
    const coronalPos = calculateSlicePlanePosition(sliceIndices.coronal, 'coronal', volume);
    const sagittalPos = calculateSlicePlanePosition(sliceIndices.sagittal, 'sagittal', volume);

    const maxDim = Math.max(
      volume.dimensions.x * volume.spacing.x,
      volume.dimensions.y * volume.spacing.y,
      volume.dimensions.z * volume.spacing.z
    );

    axialPlaneMeshRef.current.position.z = axialPos / maxDim;
    coronalPlaneMeshRef.current.position.y = coronalPos / maxDim;
    sagittalPlaneMeshRef.current.position.x = sagittalPos / maxDim;

    // Update slice textures
    updateSliceMaterial(axialPlaneMaterialRef.current, { sliceIndex: sliceIndices.axial });
    updateSliceMaterial(coronalPlaneMaterialRef.current, { sliceIndex: sliceIndices.coronal });
    updateSliceMaterial(sagittalPlaneMaterialRef.current, { sliceIndex: sliceIndices.sagittal });
  }, [sliceIndices, volume]);

  // Update slice plane materials when window/level changes
  useEffect(() => {
    if (!volume || !axialPlaneMaterialRef.current ||
      !coronalPlaneMaterialRef.current || !sagittalPlaneMaterialRef.current) return;

    const range = volume.dataRange.max - volume.dataRange.min;
    const normalizedCenter = (windowLevel.center - volume.dataRange.min) / range;
    const normalizedWidth = windowLevel.width / range;

    updateSliceMaterial(axialPlaneMaterialRef.current, {
      windowCenter: normalizedCenter,
      windowWidth: normalizedWidth,
    });
    updateSliceMaterial(coronalPlaneMaterialRef.current, {
      windowCenter: normalizedCenter,
      windowWidth: normalizedWidth,
    });
    updateSliceMaterial(sagittalPlaneMaterialRef.current, {
      windowCenter: normalizedCenter,
      windowWidth: normalizedWidth,
    });
  }, [windowLevel, volume]);

  // Update slice plane visibility
  useEffect(() => {
    if (!axialPlaneMeshRef.current || !coronalPlaneMeshRef.current ||
      !sagittalPlaneMeshRef.current) return;

    axialPlaneMeshRef.current.visible = showSlicePlanes && slicePlaneSettings.visibility.axial;
    coronalPlaneMeshRef.current.visible = showSlicePlanes && slicePlaneSettings.visibility.coronal;
    sagittalPlaneMeshRef.current.visible = showSlicePlanes && slicePlaneSettings.visibility.sagittal;
  }, [showSlicePlanes, slicePlaneSettings.visibility]);

  // Update slice plane opacity when settings change
  useEffect(() => {
    if (!axialPlaneMaterialRef.current || !coronalPlaneMaterialRef.current ||
      !sagittalPlaneMaterialRef.current) return;

    // Update opacity (materials now show actual slice textures, not solid colors)
    axialPlaneMaterialRef.current.opacity = slicePlaneSettings.opacity;
    coronalPlaneMaterialRef.current.opacity = slicePlaneSettings.opacity;
    sagittalPlaneMaterialRef.current.opacity = slicePlaneSettings.opacity;
  }, [slicePlaneSettings.opacity]);

  // Handle mode switching between textured and colored
  useEffect(() => {
    if (!volume || !volumeTexture || !axialPlaneMeshRef.current ||
        !coronalPlaneMeshRef.current || !sagittalPlaneMeshRef.current) return;
    if (!axialPlaneMaterialRef.current || !coronalPlaneMaterialRef.current ||
        !sagittalPlaneMaterialRef.current) return;

    // Calculate normalized window/level
    const range = volume.dataRange.max - volume.dataRange.min;
    const normalizedCenter = (windowLevel.center - volume.dataRange.min) / range;
    const normalizedWidth = windowLevel.width / range;

    // Dispose old materials
    axialPlaneMaterialRef.current.dispose();
    coronalPlaneMaterialRef.current.dispose();
    sagittalPlaneMaterialRef.current.dispose();

    // Create new materials based on mode
    if (slicePlaneSettings.mode === 'textured') {
      axialPlaneMaterialRef.current = createTexturedSlicePlaneMaterial(
        volumeTexture,
        'axial',
        sliceIndices.axial,
        volume.dimensions,
        normalizedCenter,
        normalizedWidth,
        slicePlaneSettings.opacity
      );
      coronalPlaneMaterialRef.current = createTexturedSlicePlaneMaterial(
        volumeTexture,
        'coronal',
        sliceIndices.coronal,
        volume.dimensions,
        normalizedCenter,
        normalizedWidth,
        slicePlaneSettings.opacity
      );
      sagittalPlaneMaterialRef.current = createTexturedSlicePlaneMaterial(
        volumeTexture,
        'sagittal',
        sliceIndices.sagittal,
        volume.dimensions,
        normalizedCenter,
        normalizedWidth,
        slicePlaneSettings.opacity
      );
    } else {
      axialPlaneMaterialRef.current = createColoredSlicePlaneMaterial(
        slicePlaneSettings.colors.axial,
        slicePlaneSettings.opacity
      );
      coronalPlaneMaterialRef.current = createColoredSlicePlaneMaterial(
        slicePlaneSettings.colors.coronal,
        slicePlaneSettings.opacity
      );
      sagittalPlaneMaterialRef.current = createColoredSlicePlaneMaterial(
        slicePlaneSettings.colors.sagittal,
        slicePlaneSettings.opacity
      );
    }

    // Update meshes with new materials
    axialPlaneMeshRef.current.material = axialPlaneMaterialRef.current;
    coronalPlaneMeshRef.current.material = coronalPlaneMaterialRef.current;
    sagittalPlaneMeshRef.current.material = sagittalPlaneMaterialRef.current;
  }, [slicePlaneSettings.mode, volume, volumeTexture, sliceIndices, windowLevel, slicePlaneSettings.colors, slicePlaneSettings.opacity]);

  // Update volume raymarching uniforms when settings change
  useEffect(() => {
    if (!volumeMaterialRef.current) return;

    updateRaymarchUniforms(volumeMaterialRef.current, {
      stepSize: raymarchSettings.stepSize,
      opacity: raymarchSettings.opacity,
      threshold: raymarchSettings.threshold,
    });
  }, [raymarchSettings.stepSize, raymarchSettings.opacity, raymarchSettings.threshold]);

  // Update camera aspect ratios when viewport size changes
  useEffect(() => {
    if (
      !axialCameraRef.current || !coronalCameraRef.current ||
      !sagittalCameraRef.current || !volumeCameraRef.current ||
      !volume
    ) return;

    const halfWidth = size.width / 2;
    const halfHeight = size.height / 2;
    const viewportAspect = halfWidth / halfHeight;

    // Update slice cameras
    const cameras = [
      { cam: axialCameraRef.current, dims: getSliceDimensions(volume, 'axial') },
      { cam: coronalCameraRef.current, dims: getSliceDimensions(volume, 'coronal') },
      { cam: sagittalCameraRef.current, dims: getSliceDimensions(volume, 'sagittal') },
    ];

    cameras.forEach(({ cam, dims }) => {
      const sliceAspect = dims.width / dims.height;
      const isHorizontal = sliceAspect > viewportAspect;

      // Fit to viewport
      const zoomFactor = isHorizontal
        ? dims.width / 2
        : dims.height / 2 * viewportAspect;

      cam.left = -zoomFactor;
      cam.right = zoomFactor;
      cam.top = zoomFactor / viewportAspect;
      cam.bottom = -zoomFactor / viewportAspect;
      cam.updateProjectionMatrix();
    });

    // Update volume camera
    const volCam = volumeCameraRef.current;
    volCam.left = -viewportAspect;
    volCam.right = viewportAspect;
    volCam.top = 1;
    volCam.bottom = -1;
    volCam.updateProjectionMatrix();

  }, [size, volume]);

  // Render to viewports
  useFrame(() => {
    if (
      !axialSceneRef.current || !coronalSceneRef.current ||
      !sagittalSceneRef.current || !volumeSceneRef.current ||
      !axialCameraRef.current || !coronalCameraRef.current ||
      !sagittalCameraRef.current || !volumeCameraRef.current
    ) return;

    const width = size.width;
    const height = size.height;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Update volume camera from controls if available
    if (controlsRef.current) {
      controlsRef.current.update();
    }

    // Update volume uniforms
    if (volumeMaterialRef.current && volumeSceneRef.current && volumeCameraRef.current) {
      updateRaymarchCameraUniforms(volumeMaterialRef.current, volumeCameraRef.current);
    }

    // Clear once for the whole canvas
    gl.clear(true, true, true);

    // Render axial (top-left)
    // NOTE: for WebGPU viewport Y=0 is at TOP of canvas (WebGL has Y=0 at bottom)
    gl.setViewport(0, 0, halfWidth, halfHeight);
    gl.setScissor(0, 0, halfWidth, halfHeight);
    gl.setScissorTest(true);
    gl.render(axialSceneRef.current, axialCameraRef.current);

    // Render coronal (top-right)
    gl.setViewport(halfWidth, 0, halfWidth, halfHeight);
    gl.setScissor(halfWidth, 0, halfWidth, halfHeight);
    gl.render(coronalSceneRef.current, coronalCameraRef.current);

    // Render sagittal (bottom-left)
    gl.setViewport(0, halfHeight, halfWidth, halfHeight);
    gl.setScissor(0, halfHeight, halfWidth, halfHeight);
    gl.render(sagittalSceneRef.current, sagittalCameraRef.current);

    // Render volume (bottom-right)
    gl.setViewport(halfWidth, halfHeight, halfWidth, halfHeight);
    gl.setScissor(halfWidth, halfHeight, halfWidth, halfHeight);
    gl.render(volumeSceneRef.current, volumeCameraRef.current);

    // Reset scissor test
    gl.setScissorTest(false);
  }, 1); // Render manual, priority 1

  // Store controls ref from OrbitControls (placed in volumeScene context)
  useEffect(() => {
    if (volumeCameraRef.current && volumeViewportRef.current) {
      // Create OrbitControls for volume camera, attached to volume viewport div
      const controls = new OrbitControls(volumeCameraRef.current, volumeViewportRef.current);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controlsRef.current = controls;

      return () => {
        controls.dispose();
      };
    }
  }, [volumeViewportRef]);

  return null;
}

export function LayoutQuad() {
  const controlPanelOpen = useViewerStore((state) => state.controlPanelOpen);
  const controlPanelPinned = useViewerStore((state) => state.controlPanelPinned);

  // HACK: This shouldn't be hardcoded here, but derived from ControlPanel height
  const panelHeight = controlPanelOpen && controlPanelPinned ? 204 : 0;
  const labelOffset = controlPanelOpen ? 204 : 0; // Shift labels even when panel is unpinned

  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const volumeViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      const height = window.innerHeight - panelHeight;
      const width = window.innerWidth;
      setCanvasDimensions({ width, height });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [panelHeight]);

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
        <ViewportRenderer volumeViewportRef={volumeViewportRef} />
        <InspectorControls />
      </Canvas>

      {/* Volume viewport div - OrbitControls attach to this */}
      <div
        ref={volumeViewportRef}
        style={{
          position: 'absolute',
          left: '50%',
          top: `calc(50% + ${panelHeight / 2}px)`,
          width: '50%',
          height: '50%',
          pointerEvents: 'auto',
          zIndex: 1,
          transition: 'top 0.3s ease-in-out',
        }}
      />

      {/* Slice interaction handler - captures pointer events on slice views */}
      <SliceInteractionHandler
        layoutMode="quad"
        canvasWidth={canvasDimensions.width}
        canvasHeight={canvasDimensions.height}
        panelHeight={panelHeight}
      />

      {/* Viewport labels */}
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
        Axial
      </div>
      <div style={{
        position: 'absolute',
        top: `${labelOffset + 10}px`,
        right: '10px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        pointerEvents: 'none',
        transition: 'top 0.3s ease-in-out',
      }}>
        Coronal
      </div>
      <div style={{
        position: 'absolute',
        top: `calc(50% + ${panelHeight / 2}px)`,
        left: '10px',
        marginTop: '10px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        pointerEvents: 'none',
        transition: 'top 0.3s ease-in-out',
      }}>
        Sagittal
      </div>
      <div style={{
        position: 'absolute',
        top: `calc(50% + ${panelHeight / 2}px)`,
        right: '10px',
        marginTop: '10px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        pointerEvents: 'none',
        transition: 'top 0.3s ease-in-out',
      }}>
        3D Volume
      </div>

      {/* Grid lines */}
      <div style={{
        position: 'absolute',
        top: `calc(50% + ${panelHeight / 2}px)`,
        left: 0,
        right: 0,
        height: '2px',
        backgroundColor: '#333',
        pointerEvents: 'none',
        transition: 'top 0.3s ease-in-out',
      }} />
      <div style={{
        position: 'absolute',
        top: `${panelHeight}px`,
        bottom: 0,
        left: '50%',
        width: '2px',
        backgroundColor: '#333',
        pointerEvents: 'none',
        transition: 'top 0.3s ease-in-out',
      }} />

      {/* Crosshairs */}
      <Crosshairs
        layoutMode="quad"
        canvasWidth={canvasDimensions.width}
        canvasHeight={canvasDimensions.height}
        panelHeight={panelHeight}
      />
    </div>
  );
}
