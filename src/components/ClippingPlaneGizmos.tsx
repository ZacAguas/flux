/**
 * Clipping Plane Gizmos Component
 *
 * Provides interactive transform controls (gizmos) for dragging clipping planes
 * in the 3D view. Uses @react-three/drei TransformControls.
 */

import { useRef } from 'react';
import { TransformControls } from '@react-three/drei';
import type * as THREE from 'three';
import { useViewerStore } from '../store/viewerStore';
import { getVolumeDimensions } from '../utils/layout';

interface ClippingPlaneGizmosProps {
  axialMesh: THREE.Mesh | undefined;
  coronalMesh: THREE.Mesh | undefined;
  sagittalMesh: THREE.Mesh | undefined;
}

/**
 * Interactive gizmos for clipping planes.
 * Renders TransformControls attached to each clipping plane mesh.
 */
export function ClippingPlaneGizmos({ axialMesh, coronalMesh, sagittalMesh }: ClippingPlaneGizmosProps) {
  const volume = useViewerStore((state) => state.volume);
  const clippingPlanes = useViewerStore((state) => state.clippingPlanes);
  const setClippingPlane = useViewerStore((state) => state.setClippingPlane);

  // Track if user is currently dragging to prevent conflicts
  const isDraggingRef = useRef(false);

  const volDims = volume ? getVolumeDimensions(volume) : null;

  // Handle axial plane drag
  const handleAxialChange = () => {
    if (!axialMesh || !volDims) return;

    // Convert world Z position back to normalized [0,1]
    const normalizedZ = (axialMesh.position.z / volDims.depth) + 0.5;
    const clampedZ = Math.max(0, Math.min(1, normalizedZ));

    // Clamp the mesh position directly to prevent jumping when dragging outside valid range
    const clampedWorldZ = (clampedZ - 0.5) * volDims.depth;
    axialMesh.position.z = clampedWorldZ;

    setClippingPlane('axial', { position: clampedZ });
  };

  // Handle coronal plane drag
  const handleCoronalChange = () => {
    if (!coronalMesh || !volDims) return;

    const normalizedY = (coronalMesh.position.y / volDims.height) + 0.5;
    const clampedY = Math.max(0, Math.min(1, normalizedY));

    // Clamp the mesh position directly to prevent jumping when dragging outside valid range
    const clampedWorldY = (clampedY - 0.5) * volDims.height;
    coronalMesh.position.y = clampedWorldY;

    setClippingPlane('coronal', { position: clampedY });
  };

  // Handle sagittal plane drag
  const handleSagittalChange = () => {
    if (!sagittalMesh || !volDims) return;

    const normalizedX = (sagittalMesh.position.x / volDims.width) + 0.5;
    const clampedX = Math.max(0, Math.min(1, normalizedX));

    // Clamp the mesh position directly to prevent jumping when dragging outside valid range
    const clampedWorldX = (clampedX - 0.5) * volDims.width;
    sagittalMesh.position.x = clampedWorldX;

    setClippingPlane('sagittal', { position: clampedX });
  };

  if (!clippingPlanes.axial.enabled && !clippingPlanes.coronal.enabled && !clippingPlanes.sagittal.enabled) {
    return null; // No gizmos if all planes disabled
  }

  return (
    <>
      {/* Axial plane gizmo */}
      {clippingPlanes.axial.enabled && axialMesh && (
        <TransformControls
          object={axialMesh}
          mode="translate"
          showX={false}
          showY={false}
          showZ={true}
          onMouseDown={() => { isDraggingRef.current = true; }}
          onMouseUp={() => { isDraggingRef.current = false; }}
          onChange={handleAxialChange}
        />
      )}

      {/* Coronal plane gizmo */}
      {clippingPlanes.coronal.enabled && coronalMesh && (
        <TransformControls
          object={coronalMesh}
          mode="translate"
          showX={false}
          showY={true}
          showZ={false}
          onMouseDown={() => { isDraggingRef.current = true; }}
          onMouseUp={() => { isDraggingRef.current = false; }}
          onChange={handleCoronalChange}
        />
      )}

      {/* Sagittal plane gizmo */}
      {clippingPlanes.sagittal.enabled && sagittalMesh && (
        <TransformControls
          object={sagittalMesh}
          mode="translate"
          showX={true}
          showY={false}
          showZ={false}
          onMouseDown={() => { isDraggingRef.current = true; }}
          onMouseUp={() => { isDraggingRef.current = false; }}
          onChange={handleSagittalChange}
        />
      )}
    </>
  );
}
