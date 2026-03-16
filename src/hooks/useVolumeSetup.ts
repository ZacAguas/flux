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
  updateVolumeTexture,
  updateTransferFunctionTexture,
  updateClippingPlaneUniforms,
} from '../shaders/volumeRaymarch';
import { getVolumeDimensions } from '../utils/layout';
import { generateTransferFunctionTexture } from '../utils/transferFunctionTexture';
import { createVolumeTexture, calculateTextureMemory } from '../utils/volumeTextureConverter';

/**
 * Custom hook to setup and manage the volume raymarching mesh and material.
 *
 * @returns Object containing the mesh, material, and helper functions.
 */
export function useVolumeSetup() {
  const volume = useViewerStore((state) => state.volume);
  const volumeTexture = useViewerStore((state) => state.volumeTexture);
  const timeStep = useViewerStore((state) => state.timeStep);
  const textureCache = useViewerStore((state) => state.textureCache);
  const raymarchSettings = useViewerStore((state) => state.raymarchSettings);
  const transferFunction = useViewerStore((state) => state.transferFunction);
  const clippingPlanes = useViewerStore((state) => state.clippingPlanes);
  const setTransferFunctionTexture = useViewerStore((state) => state.setTransferFunctionTexture);
  const setVolumeTexture = useViewerStore((state) => state.setVolumeTexture);
  const setIsLoadingTimeStep = useViewerStore((state) => state.setIsLoadingTimeStep);
  const addTextureToCache = useViewerStore((state) => state.addTextureToCache);

  const materialRef = useRef<THREE.MeshBasicNodeMaterial | undefined>(undefined);
  const [mesh, setMesh] = useState<THREE.Mesh | null>(null);
  const isGeneratingRef = useRef<boolean>(false);
  const bufferPoolRef = useRef<Float32Array | null>(null);

  // Helper to get volume dimensions for scaling
  const volumeDimensions = volume ? getVolumeDimensions(volume) : null;

  // Create mesh and buffer pool once when volume loads
  useEffect(() => {
    if (!volume) return;

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const newMesh = new THREE.Mesh(geometry);

    // Scale mesh
    const dims = getVolumeDimensions(volume);
    newMesh.scale.set(dims.width, dims.height, dims.depth);

    setMesh(newMesh);

    // Create buffer pool for zero-allocation texture generation (4D volumes only)
    // Size: single 3D volume (x * y * z voxels)
    // Only created once per volume, reused for all time step navigations
    if (volume.dimensions.t && volume.dimensions.t > 1) {
      const volumeSize = volume.dimensions.x * volume.dimensions.y * volume.dimensions.z;
      bufferPoolRef.current = new Float32Array(volumeSize);
      console.log(`Buffer pool created: ${(volumeSize * 4 / (1024 * 1024)).toFixed(1)} MB`);
    }

    return () => {
      geometry.dispose();
      setMesh(null);
      bufferPoolRef.current = null; // Release buffer
    };
  }, [volume]); // Only depend on volume, not volumeTexture (buffer persists across time steps)

  // Create/update material separately
  useEffect(() => {
    if (!volumeTexture || !volume || !mesh) return;

    // Dispose old material
    if (materialRef.current) {
      materialRef.current.dispose();
    }

    // Generate transfer function texture
    const tfTexture = generateTransferFunctionTexture(transferFunction);
    setTransferFunctionTexture(tfTexture);

    // Create material with transfer function texture
    const newMaterial = createVolumeRaymarchMaterial(
      volumeTexture,
      tfTexture,
      {
        stepSize: raymarchSettings.stepSize,
        threshold: raymarchSettings.threshold,
        thresholdMax: raymarchSettings.thresholdMax,
      }
    );

    // Initialize clipping plane uniforms on material creation
    updateClippingPlaneUniforms(newMaterial, {
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

    // Update mesh uniforms
    updateRaymarchMeshUniforms(newMaterial, mesh);

    // Assign material to mesh
    mesh.material = newMaterial;
    materialRef.current = newMaterial;

    return () => {
      materialRef.current?.dispose();
    };

    // NOTE: volumeTexture removed from deps - we update it separately below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume, mesh, transferFunction, raymarchSettings.stepSize, raymarchSettings.threshold, raymarchSettings.thresholdMax, setTransferFunctionTexture, clippingPlanes]);

  // Update volume texture uniform when volumeTexture changes (4D time step navigation)
  // This avoids recreating the entire material, preventing memory leaks during playback
  useEffect(() => {
    if (!materialRef.current || !volumeTexture) return;

    updateVolumeTexture(materialRef.current, volumeTexture);
  }, [volumeTexture]);

  // Regenerate volume texture when time step changes (with caching)
  useEffect(() => {
    if (!volume || !volume.dimensions.t || volume.dimensions.t <= 1) return;

    // Check cache first
    const cached = textureCache.get(timeStep);
    if (cached) {
      setVolumeTexture(cached);
      return;
    }

    // Skip if already generating a texture (prevents concurrent writes to buffer pool)
    if (isGeneratingRef.current) {
      console.warn(`Time step ${timeStep}: Skipped (generation in progress)`);
      return;
    }

    isGeneratingRef.current = true;
    setIsLoadingTimeStep(true);

    // Generate texture synchronously using buffer pool
    try {
      // Generate new texture for current time step (with buffer pool for zero-allocation)
      const newTexture = createVolumeTexture(volume, timeStep, bufferPoolRef.current || undefined);

      const memoryMB = calculateTextureMemory(newTexture);
      // Log memory usage
      // console.log(`Time step ${timeStep}: ${memoryMB.toFixed(1)} MB`);

      // Warn if single texture exceeds 512MB
      if (memoryMB > 512) {
        console.warn(`Large texture (${memoryMB.toFixed(1)} MB). Window loading disabled for memory safety.`);
      }

      // Update texture (auto-disposes old texture if not in cache)
      setVolumeTexture(newTexture);

      // Add to cache if texture is reasonable size (<512MB)
      if (memoryMB <= 512) {
        addTextureToCache(timeStep, newTexture);

        // NOTE: Background preloading disabled because buffer pool is singular
        // We reuse a single Float32Array buffer for zero-allocation generation
        // Parallel preloading would require multiple buffers or risk data corruption
        // Cache builds progressively during normal playback (forward navigation caches as you go)
        // PERF: Web Worker with separate buffer could enable true parallel preloading
      }
    } catch (error) {
      console.error('Failed to load texture for time step', timeStep, error);
    } finally {
      isGeneratingRef.current = false;
      setIsLoadingTimeStep(false);
    }
  }, [timeStep, volume, textureCache, setVolumeTexture, setIsLoadingTimeStep, addTextureToCache]);

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
      thresholdMax: raymarchSettings.thresholdMax,
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
