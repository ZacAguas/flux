/**
 * Volume Renderer Component
 *
 * Renders 3D medical imaging volumes using GPU-accelerated raymarching.
 * Integrates with @react-three/fiber and three/webgpu.
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three/webgpu';
import { createVolumeRaymarchMaterial } from '../shaders/volumeRaymarch';
import { useViewerStore } from '../store/viewerStore';

interface VolumeRendererProps {
  stepSize?: number;
  opacity?: number;
  threshold?: number;
}

export function VolumeRenderer({
  stepSize = 0.01,
  opacity = 1.0,
  threshold = 0.1,
}: VolumeRendererProps) {
  const volume = useViewerStore((state) => state.volume);
  const volumeTexture = useViewerStore((state) => state.volumeTexture);
  const meshRef = useRef<THREE.Mesh>(null);
  const [material, setMaterial] = useState<THREE.MeshBasicNodeMaterial | null>(
    null
  );

  // Create material when volume texture is available
  useEffect(() => {
    if (!volumeTexture) return;

    // Create raymarching material
    const raymarchMaterial = createVolumeRaymarchMaterial(volumeTexture, {
      stepSize,
      opacity,
      threshold,
    });
    setMaterial(raymarchMaterial);

    // Cleanup on unmount or volume change
    return () => {
      raymarchMaterial.dispose();
    };
  }, [volumeTexture, stepSize, opacity, threshold]);

  // Update material when it's created
  useEffect(() => {
    if (meshRef.current && material) {
      meshRef.current.material = material;
    }
  }, [material]);

  // FIXME: rotating mesh/camera results in weird clipping artifacts along volume edges

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
