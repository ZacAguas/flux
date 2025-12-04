/**
 * Slice Viewer Component
 *
 * Renders 2D slices from 3D volume texture using GPU-accelerated slice extraction.
 * Supports axial, coronal, and sagittal orientations.
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three/webgpu';
import type { SliceOrientation } from '../types/layout';
import { createSliceMaterial, updateSliceMaterial } from '../shaders/sliceShader';
import { useViewerStore } from '../store/viewerStore';

interface SliceViewerProps {
  orientation: SliceOrientation;
}

export function SliceViewer({ orientation }: SliceViewerProps) {
  const volume = useViewerStore((state) => state.volume);
  const volumeTexture = useViewerStore((state) => state.volumeTexture);
  const sliceIndices = useViewerStore((state) => state.sliceIndices);
  const windowLevel = useViewerStore((state) => state.windowLevel);

  const meshRef = useRef<THREE.Mesh>(null);
  const [material, setMaterial] = useState<THREE.MeshBasicNodeMaterial | null>(null);

  // Get current slice index for this orientation
  const sliceIndex = sliceIndices[orientation];

  // Create material when volume texture is available
  useEffect(() => {
    if (!volumeTexture || !volume) return;

    // NOTE: Volume texture is normalized to [0,1], so we need to normalize window/level values too
    const range = volume.dataRange.max - volume.dataRange.min;
    const normalizedCenter = (windowLevel.center - volume.dataRange.min) / range;
    const normalizedWidth = windowLevel.width / range;

    const sliceMaterial = createSliceMaterial(
      volumeTexture,
      orientation,
      sliceIndex,
      volume.dimensions,
      normalizedCenter,
      normalizedWidth
    );

    setMaterial(sliceMaterial);

    return () => {
      sliceMaterial.dispose();
    };
    // NOTE:Only recreate material when volume/texture changes
    // Not on every slice/window change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volumeTexture, volume, orientation]);

  // Update material parameters when slice/window changes
  useEffect(() => {
    if (!material || !volume) return;

    // Normalize window/level values to [0,1] range
    const range = volume.dataRange.max - volume.dataRange.min;
    const normalizedCenter = (windowLevel.center - volume.dataRange.min) / range;
    const normalizedWidth = windowLevel.width / range;

    updateSliceMaterial(material, {
      sliceIndex,
      windowCenter: normalizedCenter,
      windowWidth: normalizedWidth,
    });
  }, [material, sliceIndex, windowLevel, volume]);

  // Update material on mesh when it's created
  useEffect(() => {
    if (meshRef.current && material) {
      meshRef.current.material = material;
    }
  }, [material]);

  if (!volume || !material) {
    return null;
  }

  // Calculate plane geometry size based on volume dimensions and spacing
  const { dimensions, spacing } = volume;
  let width, height;

  if (orientation === 'axial') {
    // XY plane
    width = dimensions.x * spacing.x;
    height = dimensions.y * spacing.y;
  } else if (orientation === 'coronal') {
    // XZ plane
    width = dimensions.x * spacing.x;
    height = dimensions.z * spacing.z;
  } else {
    // Sagittal: YZ plane
    width = dimensions.y * spacing.y;
    height = dimensions.z * spacing.z;
  }

  // Normalize to unit square while maintaining aspect ratio
  const maxDim = Math.max(width, height);
  const normalizedWidth = width / maxDim;
  const normalizedHeight = height / maxDim;

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[normalizedWidth, normalizedHeight]} />
      {/* Material is set via ref in useEffect */}
    </mesh>
  );
}
