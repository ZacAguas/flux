/**
 * Volume Renderer Component
 *
 * Renders 3D medical imaging volumes using GPU-accelerated raymarching.
 * Integrates with @react-three/fiber and three/webgpu.
 */

import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three/webgpu';
import {
  createVolumeRaymarchMaterial,
  updateRaymarchCameraUniforms,
  updateRaymarchMeshUniforms,
  updateRaymarchUniforms,
} from '../shaders/volumeRaymarch';
import { useViewerStore } from '../store/viewerStore';

export function VolumeRenderer() {
  const volume = useViewerStore((state) => state.volume);
  const volumeTexture = useViewerStore((state) => state.volumeTexture);
  const raymarchSettings = useViewerStore((state) => state.raymarchSettings);
  const meshRef = useRef<THREE.Mesh>(null);
  const [material, setMaterial] = useState<THREE.MeshBasicNodeMaterial | null>(
    null
  );

  // Create material when volume texture is available
  useEffect(() => {
    if (!volumeTexture) return;

    // Create raymarching material
    const raymarchMaterial = createVolumeRaymarchMaterial(volumeTexture, {
      stepSize: raymarchSettings.stepSize,
      opacity: raymarchSettings.opacity,
      threshold: raymarchSettings.threshold,
    });
    setMaterial(raymarchMaterial);

    // Cleanup on unmount or volume change
    return () => {
      raymarchMaterial.dispose();
    };
  }, [volumeTexture, raymarchSettings]);

  // Update raymarching uniforms when settings change (without recreating material)
  useEffect(() => {
    if (!material) return;

    updateRaymarchUniforms(material, {
      stepSize: raymarchSettings.stepSize,
      opacity: raymarchSettings.opacity,
      threshold: raymarchSettings.threshold,
    });
  }, [material, raymarchSettings.stepSize, raymarchSettings.opacity, raymarchSettings.threshold]);

  // Update material and mesh uniforms when created or volume changes
  useEffect(() => {
    if (meshRef.current && material) {
      meshRef.current.material = material;
      // Update mesh-related uniforms (inverseModelMatrix) once since mesh is static
      updateRaymarchMeshUniforms(material, meshRef.current);
    }
  }, [material, volume]);

  // Update camera uniforms every frame
  useFrame(({ camera }) => {
    if (material) {
      updateRaymarchCameraUniforms(material, camera);
    }
  });

  if (!volume || !material) {
    return null;
  }

  // Calculate volume aspect ratio for proper scaling
  const { dimensions, spacing } = volume;
  const scaleX = (dimensions.x * spacing.x) / Math.max(
    dimensions.x * spacing.x,
    dimensions.y * spacing.y,
    dimensions.z * spacing.z
  );
  const scaleY = (dimensions.y * spacing.y) / Math.max(
    dimensions.x * spacing.x,
    dimensions.y * spacing.y,
    dimensions.z * spacing.z
  );
  const scaleZ = (dimensions.z * spacing.z) / Math.max(
    dimensions.x * spacing.x,
    dimensions.y * spacing.y,
    dimensions.z * spacing.z
  );

  return (
    <mesh ref={meshRef} scale={[scaleX, scaleY, scaleZ]}>
      <boxGeometry args={[1, 1, 1]} />
      {/* Material is set via ref in useEffect */}
    </mesh>
  );
}
