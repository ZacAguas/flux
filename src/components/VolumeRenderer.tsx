/**
 * Volume Renderer Component
 *
 * Renders 3D medical imaging volumes using GPU-accelerated raymarching.
 * Integrates with @react-three/fiber and three/webgpu.
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three/webgpu';
import type { NiftiVolume } from '../types';
import { createVolumeTexture } from '../utils/volumeTextureConverter';
import { createVolumeRaymarchMaterial } from '../shaders/volumeRaymarch';

interface VolumeRendererProps {
  volume: NiftiVolume;
  stepSize?: number;
  opacity?: number;
  threshold?: number;
  timeStep?: number;
}

export function VolumeRenderer({
  volume,
  stepSize = 0.01,
  opacity = 1.0,
  threshold = 0.1,
  timeStep = 0,
}: VolumeRendererProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [material, setMaterial] = useState<THREE.MeshBasicNodeMaterial | null>(
    null
  );

  // Create texture and material when volume loads or time step changes
  useEffect(() => {
    if (!volume) return;

    // Create 3D texture from volume data
    const volumeTexture = createVolumeTexture(volume, timeStep);

    // Create raymarching material
    const raymarchMaterial = createVolumeRaymarchMaterial(volumeTexture, {
      stepSize,
      opacity,
      threshold,
    });
    setMaterial(raymarchMaterial);

    // Cleanup on unmount or volume change
    return () => {
      volumeTexture.dispose();
      raymarchMaterial.dispose();
    };
  }, [volume, timeStep, stepSize, opacity, threshold]);

  // Update material when it's created
  useEffect(() => {
    if (meshRef.current && material) {
      meshRef.current.material = material;
    }
  }, [material]);

  // FIXME: rotating mesh/camera results in weird clipping artifacts along volume edges

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

  if (!material) {
    return null;
  }

  return (
    <mesh ref={meshRef} scale={[scaleX, scaleY, scaleZ]}>
      <boxGeometry args={[1, 1, 1]} />
      {/* Material is set via ref in useEffect */}
    </mesh>
  );
}
