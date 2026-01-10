/**
 * Slice Planes In Volume Hook
 *
 * Manages the visualization of slice planes within the 3D volume view.
 * Handles:
 * - Creation of plane meshes indicating the current slice positions
 * - Updating positions based on slice indices
 * - Switching between 'textured' (actual slice content) and 'colored' (solid color) modes
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three/webgpu';
import { useViewerStore } from '../store/viewerStore';
import {
  calculateSlicePlanePosition,
  calculateSlicePlaneScale,
  createColoredSlicePlaneMaterial,
  createTexturedSlicePlaneMaterial,
} from '../utils/slicePlaneHelpers';
import { updateSliceMaterial } from '../shaders/sliceShader';
import { getVolumeDimensions } from '../utils/layout';

/**
 * Custom hook to add and manage slice plane indicators in a given 3D scene.
 *
 * @param scene The THREE.Scene where the planes should be added.
 */
export function useSlicePlanesInVolume(scene: THREE.Scene | undefined) {
  const volume = useViewerStore((state) => state.volume);
  const volumeTexture = useViewerStore((state) => state.volumeTexture);
  const sliceIndices = useViewerStore((state) => state.sliceIndices);
  const windowLevel = useViewerStore((state) => state.windowLevel);
  const showSlicePlanes = useViewerStore((state) => state.showSlicePlanes);
  const slicePlaneSettings = useViewerStore((state) => state.slicePlaneSettings);

  const axialMeshRef = useRef<THREE.Mesh | undefined>(undefined);
  const coronalMeshRef = useRef<THREE.Mesh | undefined>(undefined);
  const sagittalMeshRef = useRef<THREE.Mesh | undefined>(undefined);

  const axialMatRef = useRef<THREE.MeshBasicNodeMaterial | undefined>(undefined);
  const coronalMatRef = useRef<THREE.MeshBasicNodeMaterial | undefined>(undefined);
  const sagittalMatRef = useRef<THREE.MeshBasicNodeMaterial | undefined>(undefined);

  // Create/Recreate meshes and materials
  useEffect(() => {
    if (!scene || !volume || !volumeTexture) return;

    const volDims = getVolumeDimensions(volume);
    const range = volume.dataRange.max - volume.dataRange.min;
    const normalizedCenter = (windowLevel.center - volume.dataRange.min) / range;
    const normalizedWidth = windowLevel.width / range;

    // Helper to create material
    const createMat = (orientation: 'axial' | 'coronal' | 'sagittal', indices: number) => {
      if (slicePlaneSettings.mode === 'textured') {
        return createTexturedSlicePlaneMaterial(
          volumeTexture, orientation, indices, volume.dimensions,
          normalizedCenter, normalizedWidth, slicePlaneSettings.opacity
        );
      }
      return createColoredSlicePlaneMaterial(
        slicePlaneSettings.colors[orientation], slicePlaneSettings.opacity
      );
    };

    // Dispose old
    axialMeshRef.current?.geometry.dispose();
    coronalMeshRef.current?.geometry.dispose();
    sagittalMeshRef.current?.geometry.dispose();
    axialMatRef.current?.dispose();
    coronalMatRef.current?.dispose();
    sagittalMatRef.current?.dispose();
    if (axialMeshRef.current) scene.remove(axialMeshRef.current);
    if (coronalMeshRef.current) scene.remove(coronalMeshRef.current);
    if (sagittalMeshRef.current) scene.remove(sagittalMeshRef.current);

    // Create Axial
    axialMatRef.current = createMat('axial', sliceIndices.axial);
    const axialScale = calculateSlicePlaneScale('axial', volDims);
    const axialGeo = new THREE.PlaneGeometry(1, 1);
    axialMeshRef.current = new THREE.Mesh(axialGeo, axialMatRef.current);
    axialMeshRef.current.scale.set(axialScale.width, axialScale.height, 1);
    axialMeshRef.current.visible = showSlicePlanes && slicePlaneSettings.visibility.axial;
    // axialMeshRef.current.rotation.set(0, 0, 0); // Default XY

    // Create Coronal
    coronalMatRef.current = createMat('coronal', sliceIndices.coronal);
    const coronalScale = calculateSlicePlaneScale('coronal', volDims);
    const coronalGeo = new THREE.PlaneGeometry(1, 1);
    coronalMeshRef.current = new THREE.Mesh(coronalGeo, coronalMatRef.current);
    coronalMeshRef.current.scale.set(coronalScale.width, coronalScale.height, 1);
    coronalMeshRef.current.visible = showSlicePlanes && slicePlaneSettings.visibility.coronal;
    coronalMeshRef.current.rotation.set(Math.PI / 2, 0, 0); // XZ

    // Create Sagittal
    sagittalMatRef.current = createMat('sagittal', sliceIndices.sagittal);
    const sagittalScale = calculateSlicePlaneScale('sagittal', volDims);
    const sagittalGeo = new THREE.PlaneGeometry(1, 1);
    sagittalMeshRef.current = new THREE.Mesh(sagittalGeo, sagittalMatRef.current);
    sagittalMeshRef.current.scale.set(sagittalScale.width, sagittalScale.height, 1);
    sagittalMeshRef.current.visible = showSlicePlanes && slicePlaneSettings.visibility.sagittal;
    sagittalMeshRef.current.rotation.set(0, Math.PI / 2, +Math.PI / 2); // YZ

    scene.add(axialMeshRef.current);
    scene.add(coronalMeshRef.current);
    scene.add(sagittalMeshRef.current);

    return () => {
      // NOTE: We generally rely on the parent component unmounting or this effect re-running to clean up
      // but we should remove from scene if we can.
      // Since we don't have a stable ref to 'scene' in cleanup if it changes, this is tricky,
      // but usually scene doesn't change.
      if (axialMeshRef.current) scene.remove(axialMeshRef.current);
      if (coronalMeshRef.current) scene.remove(coronalMeshRef.current);
      if (sagittalMeshRef.current) scene.remove(sagittalMeshRef.current);

      axialGeo.dispose();
      coronalGeo.dispose();
      sagittalGeo.dispose();
      axialMatRef.current?.dispose();
      coronalMatRef.current?.dispose();
      sagittalMatRef.current?.dispose();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, volume, volumeTexture, slicePlaneSettings.mode, showSlicePlanes, slicePlaneSettings.visibility]);
  // Re-run if mode changes (textured vs colored) or volume changes.
  // Include visibility states to ensure proper initial visibility when meshes are recreated

  // Update positions and textures (Slice Indices change)
  useEffect(() => {
    if (!volume || !axialMeshRef.current || !coronalMeshRef.current || !sagittalMeshRef.current) return;

    // Calculate max dim for normalization (same as in LayoutQuad)
    const maxDim = Math.max(
      volume.dimensions.x * volume.spacing.x,
      volume.dimensions.y * volume.spacing.y,
      volume.dimensions.z * volume.spacing.z
    );

    const axialPos = calculateSlicePlanePosition(sliceIndices.axial, 'axial', volume);
    const coronalPos = calculateSlicePlanePosition(sliceIndices.coronal, 'coronal', volume);
    const sagittalPos = calculateSlicePlanePosition(sliceIndices.sagittal, 'sagittal', volume);

    axialMeshRef.current.position.z = axialPos / maxDim;
    coronalMeshRef.current.position.y = coronalPos / maxDim;
    sagittalMeshRef.current.position.x = sagittalPos / maxDim;

    if (slicePlaneSettings.mode === 'textured') {
      if (axialMatRef.current) updateSliceMaterial(axialMatRef.current, { sliceIndex: sliceIndices.axial });
      if (coronalMatRef.current) updateSliceMaterial(coronalMatRef.current, { sliceIndex: sliceIndices.coronal });
      if (sagittalMatRef.current) updateSliceMaterial(sagittalMatRef.current, { sliceIndex: sliceIndices.sagittal });
    }

  }, [sliceIndices, volume, slicePlaneSettings.mode]);

  // Update Window/Level (Texture mode only)
  useEffect(() => {
    if (slicePlaneSettings.mode !== 'textured' || !volume) return;

    const range = volume.dataRange.max - volume.dataRange.min;
    const normalizedCenter = (windowLevel.center - volume.dataRange.min) / range;
    const normalizedWidth = windowLevel.width / range;

    if (axialMatRef.current) updateSliceMaterial(axialMatRef.current, { windowCenter: normalizedCenter, windowWidth: normalizedWidth });
    if (coronalMatRef.current) updateSliceMaterial(coronalMatRef.current, { windowCenter: normalizedCenter, windowWidth: normalizedWidth });
    if (sagittalMatRef.current) updateSliceMaterial(sagittalMatRef.current, { windowCenter: normalizedCenter, windowWidth: normalizedWidth });

  }, [windowLevel, volume, slicePlaneSettings.mode]);

  // Update Visibility
  useEffect(() => {
    if (!axialMeshRef.current || !coronalMeshRef.current || !sagittalMeshRef.current) return;
    axialMeshRef.current.visible = showSlicePlanes && slicePlaneSettings.visibility.axial;
    coronalMeshRef.current.visible = showSlicePlanes && slicePlaneSettings.visibility.coronal;
    sagittalMeshRef.current.visible = showSlicePlanes && slicePlaneSettings.visibility.sagittal;
  }, [showSlicePlanes, slicePlaneSettings.visibility]);

  // Update Opacity and Colors
  useEffect(() => {
    if (!axialMatRef.current || !coronalMatRef.current || !sagittalMatRef.current) return;

    axialMatRef.current.opacity = slicePlaneSettings.opacity;
    coronalMatRef.current.opacity = slicePlaneSettings.opacity;
    sagittalMatRef.current.opacity = slicePlaneSettings.opacity;

    if (slicePlaneSettings.mode === 'colored') {
      // We can cast because we created them as such in 'colored' mode, but careful
      // Actually createColoredSlicePlaneMaterial returns MeshBasicNodeMaterial, so .color exists
      if (axialMatRef.current.color) axialMatRef.current.color.set(slicePlaneSettings.colors.axial);
      if (coronalMatRef.current.color) coronalMatRef.current.color.set(slicePlaneSettings.colors.coronal);
      if (sagittalMatRef.current.color) sagittalMatRef.current.color.set(slicePlaneSettings.colors.sagittal);
    }
  }, [slicePlaneSettings.opacity, slicePlaneSettings.colors, slicePlaneSettings.mode]);

}
