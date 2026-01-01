/**
 * Volume Setup Hook
 *
 * Manages the creation and updates of the 3D volume mesh and material for raymarching.
 * Handles:
 * - Material creation based on volume texture and raymarch settings
 * - Mesh creation and scaling based on volume dimensions
 * - Uniform updates for the raymarching shader
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three/webgpu';
import { useViewerStore } from '../store/viewerStore';
import {
  createVolumeRaymarchMaterial,
  updateRaymarchCameraUniforms,
  updateRaymarchMeshUniforms,
  updateRaymarchUniforms,
  updateTransferFunctionTexture,
  updateClippingPlaneUniforms,
} from '../shaders/volumeRaymarch';
import { getVolumeDimensions } from '../utils/layout';
import { generateTransferFunctionTexture } from '../utils/transferFunctionTexture';

/**
 * Custom hook to setup and manage the volume raymarching mesh and material.
 *
 * @returns Object containing the mesh, material, and helper functions.
 */
export function useVolumeSetup() {
  const volume = useViewerStore((state) => state.volume);
  const volumeTexture = useViewerStore((state) => state.volumeTexture);
  const raymarchSettings = useViewerStore((state) => state.raymarchSettings);
  const transferFunction = useViewerStore((state) => state.transferFunction);
  const clippingPlanes = useViewerStore((state) => state.clippingPlanes);
  const setTransferFunctionTexture = useViewerStore((state) => state.setTransferFunctionTexture);

  const materialRef = useRef<THREE.MeshBasicNodeMaterial | undefined>(undefined);
  const [mesh, setMesh] = useState<THREE.Mesh | null>(null);

  // Helper to get volume dimensions for scaling
  const volumeDimensions = volume ? getVolumeDimensions(volume) : null;

  // Create material and mesh
  useEffect(() => {
    if (!volumeTexture || !volume) return;

    // Generate transfer function texture
    const tfTexture = generateTransferFunctionTexture(transferFunction);
    setTransferFunctionTexture(tfTexture);

    // Create material with transfer function texture
    materialRef.current = createVolumeRaymarchMaterial(
      volumeTexture,
      tfTexture,
      {
        stepSize: raymarchSettings.stepSize,
        threshold: raymarchSettings.threshold,
      }
    );

    // Create mesh
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const newMesh = new THREE.Mesh(geometry, materialRef.current);

    // Scale mesh
    const dims = getVolumeDimensions(volume);
    newMesh.scale.set(dims.width, dims.height, dims.depth);

    // Initial uniform update
    updateRaymarchMeshUniforms(materialRef.current, newMesh);

    setMesh(newMesh);

    return () => {
      geometry.dispose();
      materialRef.current?.dispose();
      setMesh(null);
    };
  }, [volumeTexture, volume, transferFunction, raymarchSettings.stepSize, raymarchSettings.threshold, setTransferFunctionTexture]);

  // Update transfer function texture when it changes
  useEffect(() => {
    if (!materialRef.current) return;

    const tfTexture = generateTransferFunctionTexture(transferFunction);
    updateTransferFunctionTexture(materialRef.current, tfTexture);
    setTransferFunctionTexture(tfTexture);
  }, [transferFunction, setTransferFunctionTexture]);

  // Update uniforms when settings change
  useEffect(() => {
    if (!materialRef.current) return;
    updateRaymarchUniforms(materialRef.current, {
      stepSize: raymarchSettings.stepSize,
      threshold: raymarchSettings.threshold,
    });
  }, [raymarchSettings]);

  // Update clipping plane uniforms when clipping planes change
  useEffect(() => {
    if (!materialRef.current) return;
    updateClippingPlaneUniforms(materialRef.current, {
      axial: {
        enabled: clippingPlanes.axial.enabled,
        position: clippingPlanes.axial.position,
        inverted: clippingPlanes.axial.inverted,
      },
      coronal: {
        enabled: clippingPlanes.coronal.enabled,
        position: clippingPlanes.coronal.position,
        inverted: clippingPlanes.coronal.inverted,
      },
      sagittal: {
        enabled: clippingPlanes.sagittal.enabled,
        position: clippingPlanes.sagittal.position,
        inverted: clippingPlanes.sagittal.inverted,
      },
    });
  }, [clippingPlanes]);

  // Helper to update camera uniforms (call in useFrame)
  const updateCameraUniforms = (camera: THREE.Camera) => {
    if (materialRef.current) {
      updateRaymarchCameraUniforms(materialRef.current, camera);
    }
  };

  return {
    mesh,
    material: materialRef.current,
    updateCameraUniforms,
    volumeDimensions
  };
}
