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
} from '../shaders/volumeRaymarch';
import { getVolumeDimensions } from '../utils/layout';

/**
 * Custom hook to setup and manage the volume raymarching mesh and material.
 *
 * @returns Object containing the mesh, material, and helper functions.
 */
export function useVolumeSetup() {
  const volume = useViewerStore((state) => state.volume);
  const volumeTexture = useViewerStore((state) => state.volumeTexture);
  const raymarchSettings = useViewerStore((state) => state.raymarchSettings);

  const materialRef = useRef<THREE.MeshBasicNodeMaterial | undefined>(undefined);
  const [mesh, setMesh] = useState<THREE.Mesh | null>(null);

  // Helper to get volume dimensions for scaling
  const volumeDimensions = volume ? getVolumeDimensions(volume) : null;

  // Create material and mesh
  useEffect(() => {
    if (!volumeTexture || !volume) return;

    // Create material
    materialRef.current = createVolumeRaymarchMaterial(volumeTexture, {
      stepSize: raymarchSettings.stepSize,
      opacity: raymarchSettings.opacity,
      threshold: raymarchSettings.threshold,
    });

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
  }, [volumeTexture, volume, raymarchSettings.stepSize, raymarchSettings.opacity, raymarchSettings.threshold]);

  // Update uniforms when settings change
  useEffect(() => {
    if (!materialRef.current) return;
    updateRaymarchUniforms(materialRef.current, {
      stepSize: raymarchSettings.stepSize,
      opacity: raymarchSettings.opacity,
      threshold: raymarchSettings.threshold,
    });
  }, [raymarchSettings]);

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
