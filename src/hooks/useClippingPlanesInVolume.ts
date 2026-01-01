/**
 * Clipping Planes In Volume Hook
 *
 * Manages the visualization of clipping planes within the 3D volume view.
 * Creates semi-transparent plane meshes that show where clipping occurs.
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three/webgpu';
import { useViewerStore } from '../store/viewerStore';
import { getVolumeDimensions } from '../utils/layout';

/**
 * Custom hook to add and manage clipping plane visualizations in a 3D scene.
 * @param scene The THREE.Scene where the planes should be added.
 */
export function useClippingPlanesInVolume(scene: THREE.Scene | undefined) {
  const volume = useViewerStore((state) => state.volume);
  const clippingPlanes = useViewerStore((state) => state.clippingPlanes);
  const visualization = useViewerStore((state) => state.clippingPlaneVisualization);

  const axialMeshRef = useRef<THREE.Mesh | undefined>(undefined);
  const coronalMeshRef = useRef<THREE.Mesh | undefined>(undefined);
  const sagittalMeshRef = useRef<THREE.Mesh | undefined>(undefined);

  // Create plane meshes
  useEffect(() => {
    if (!scene || !volume) return;

    const volDims = getVolumeDimensions(volume);

    // Helper to create semi-transparent plane material
    const createMaterial = (color: string) => {
      const material = new THREE.MeshBasicNodeMaterial();
      material.color.set(color);
      material.transparent = true;
      material.opacity = visualization.opacity;
      material.side = THREE.DoubleSide;
      material.depthWrite = false;
      material.depthTest = true;
      return material;
    };

    // Dispose old meshes
    if (axialMeshRef.current) scene.remove(axialMeshRef.current);
    if (coronalMeshRef.current) scene.remove(coronalMeshRef.current);
    if (sagittalMeshRef.current) scene.remove(sagittalMeshRef.current);
    axialMeshRef.current?.geometry.dispose();
    coronalMeshRef.current?.geometry.dispose();
    sagittalMeshRef.current?.geometry.dispose();
    (axialMeshRef.current?.material as THREE.Material)?.dispose();
    (coronalMeshRef.current?.material as THREE.Material)?.dispose();
    (sagittalMeshRef.current?.material as THREE.Material)?.dispose();

    // Create Axial clipping plane (XY plane)
    const axialGeo = new THREE.PlaneGeometry(1, 1);
    const axialMat = createMaterial(visualization.colors.axial);
    axialMeshRef.current = new THREE.Mesh(axialGeo, axialMat);
    axialMeshRef.current.scale.set(volDims.width, volDims.height, 1);
    // No rotation needed for axial (default XY orientation)

    // Create Coronal clipping plane (XZ plane)
    const coronalGeo = new THREE.PlaneGeometry(1, 1);
    const coronalMat = createMaterial(visualization.colors.coronal);
    coronalMeshRef.current = new THREE.Mesh(coronalGeo, coronalMat);
    coronalMeshRef.current.scale.set(volDims.width, volDims.depth, 1);
    coronalMeshRef.current.rotation.set(Math.PI / 2, 0, 0);

    // Create Sagittal clipping plane (YZ plane)
    const sagittalGeo = new THREE.PlaneGeometry(1, 1);
    const sagittalMat = createMaterial(visualization.colors.sagittal);
    sagittalMeshRef.current = new THREE.Mesh(sagittalGeo, sagittalMat);
    sagittalMeshRef.current.scale.set(volDims.height, volDims.depth, 1);
    sagittalMeshRef.current.rotation.set(0, Math.PI / 2, Math.PI / 2);

    scene.add(axialMeshRef.current);
    scene.add(coronalMeshRef.current);
    scene.add(sagittalMeshRef.current);

    return () => {
      if (axialMeshRef.current) scene.remove(axialMeshRef.current);
      if (coronalMeshRef.current) scene.remove(coronalMeshRef.current);
      if (sagittalMeshRef.current) scene.remove(sagittalMeshRef.current);
      axialGeo.dispose();
      coronalGeo.dispose();
      sagittalGeo.dispose();
      axialMat.dispose();
      coronalMat.dispose();
      sagittalMat.dispose();
    };
  }, [scene, volume, visualization.colors, visualization.opacity]);

  // Update positions based on clipping plane state
  useEffect(() => {
    if (!volume || !axialMeshRef.current || !coronalMeshRef.current || !sagittalMeshRef.current) return;

    const volDims = getVolumeDimensions(volume);

    // Convert normalized position [0,1] to world space [-0.5*dim, +0.5*dim]
    // NOTE: Clipping planes use normalized [0,1], mesh positions use world space
    const axialZ = (clippingPlanes.axial.position - 0.5) * volDims.depth;
    const coronalY = (clippingPlanes.coronal.position - 0.5) * volDims.height;
    const sagittalX = (clippingPlanes.sagittal.position - 0.5) * volDims.width;

    axialMeshRef.current.position.z = axialZ;
    coronalMeshRef.current.position.y = coronalY;
    sagittalMeshRef.current.position.x = sagittalX;
  }, [clippingPlanes, volume]);

  // Update visibility
  useEffect(() => {
    if (!axialMeshRef.current || !coronalMeshRef.current || !sagittalMeshRef.current) return;

    axialMeshRef.current.visible = visualization.showPlanes && clippingPlanes.axial.enabled;
    coronalMeshRef.current.visible = visualization.showPlanes && clippingPlanes.coronal.enabled;
    sagittalMeshRef.current.visible = visualization.showPlanes && clippingPlanes.sagittal.enabled;
  }, [visualization.showPlanes, clippingPlanes]);

  // Update opacity and colors
  useEffect(() => {
    if (!axialMeshRef.current || !coronalMeshRef.current || !sagittalMeshRef.current) return;

    const axialMat = axialMeshRef.current.material as THREE.MeshBasicNodeMaterial;
    const coronalMat = coronalMeshRef.current.material as THREE.MeshBasicNodeMaterial;
    const sagittalMat = sagittalMeshRef.current.material as THREE.MeshBasicNodeMaterial;

    axialMat.opacity = visualization.opacity;
    coronalMat.opacity = visualization.opacity;
    sagittalMat.opacity = visualization.opacity;

    axialMat.color.set(visualization.colors.axial);
    coronalMat.color.set(visualization.colors.coronal);
    sagittalMat.color.set(visualization.colors.sagittal);
  }, [visualization.opacity, visualization.colors]);

  // Return mesh refs for gizmos
  return {
    axialMesh: axialMeshRef.current,
    coronalMesh: coronalMeshRef.current,
    sagittalMesh: sagittalMeshRef.current,
  };
}
