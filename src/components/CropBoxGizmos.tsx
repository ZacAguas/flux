/**
 * Crop Box Gizmos Component
 *
 * Provides interactive transform controls (gizmos) for dragging the 6 faces
 * of the crop box in the 3D view. Uses @react-three/drei TransformControls.
 */

import { useRef } from 'react';
import { TransformControls } from '@react-three/drei';
import type * as THREE from 'three';
import { useViewerStore } from '../store/viewerStore';
import { getVolumeDimensions } from '../utils/layout';

interface CropBoxGizmosProps {
  axialMin: THREE.Object3D | undefined;
  axialMax: THREE.Object3D | undefined;
  coronalMin: THREE.Object3D | undefined;
  coronalMax: THREE.Object3D | undefined;
  sagittalMin: THREE.Object3D | undefined;
  sagittalMax: THREE.Object3D | undefined;
}

/**
 * Interactive gizmos for the 6 crop box faces.
 * Each face is draggable along its single axis.
 */
export function CropBoxGizmos({
  axialMin,
  axialMax,
  coronalMin,
  coronalMax,
  sagittalMin,
  sagittalMax,
}: CropBoxGizmosProps) {
  const volume = useViewerStore((state) => state.volume);
  const cropBox = useViewerStore((state) => state.cropBox);
  const setCropBoxAxis = useViewerStore((state) => state.setCropBoxAxis);

  const isDraggingRef = useRef(false);
  const volDims = volume ? getVolumeDimensions(volume) : null;

  const handleAxialMin = () => {
    if (!axialMin || !volDims) return;
    const normalized = axialMin.position.z / volDims.depth + 0.5;
    const clamped = Math.max(0, Math.min(cropBox.axial.max - 0.01, normalized));
    axialMin.position.z = (clamped - 0.5) * volDims.depth;
    setCropBoxAxis('axial', { min: clamped });
  };

  const handleAxialMax = () => {
    if (!axialMax || !volDims) return;
    const normalized = axialMax.position.z / volDims.depth + 0.5;
    const clamped = Math.min(1, Math.max(cropBox.axial.min + 0.01, normalized));
    axialMax.position.z = (clamped - 0.5) * volDims.depth;
    setCropBoxAxis('axial', { max: clamped });
  };

  const handleCoronalMin = () => {
    if (!coronalMin || !volDims) return;
    const normalized = coronalMin.position.y / volDims.height + 0.5;
    const clamped = Math.max(0, Math.min(cropBox.coronal.max - 0.01, normalized));
    coronalMin.position.y = (clamped - 0.5) * volDims.height;
    setCropBoxAxis('coronal', { min: clamped });
  };

  const handleCoronalMax = () => {
    if (!coronalMax || !volDims) return;
    const normalized = coronalMax.position.y / volDims.height + 0.5;
    const clamped = Math.min(1, Math.max(cropBox.coronal.min + 0.01, normalized));
    coronalMax.position.y = (clamped - 0.5) * volDims.height;
    setCropBoxAxis('coronal', { max: clamped });
  };

  const handleSagittalMin = () => {
    if (!sagittalMin || !volDims) return;
    const normalized = sagittalMin.position.x / volDims.width + 0.5;
    const clamped = Math.max(0, Math.min(cropBox.sagittal.max - 0.01, normalized));
    sagittalMin.position.x = (clamped - 0.5) * volDims.width;
    setCropBoxAxis('sagittal', { min: clamped });
  };

  const handleSagittalMax = () => {
    if (!sagittalMax || !volDims) return;
    const normalized = sagittalMax.position.x / volDims.width + 0.5;
    const clamped = Math.min(1, Math.max(cropBox.sagittal.min + 0.01, normalized));
    sagittalMax.position.x = (clamped - 0.5) * volDims.width;
    setCropBoxAxis('sagittal', { max: clamped });
  };

  if (!cropBox.enabled) return null;

  return (
    <>
      {axialMin && (
        <TransformControls
          object={axialMin}
          mode="translate"
          showX={false}
          showY={false}
          showZ={true}
          onMouseDown={() => { isDraggingRef.current = true; }}
          onMouseUp={() => { isDraggingRef.current = false; }}
          onChange={handleAxialMin}
        />
      )}
      {axialMax && (
        <TransformControls
          object={axialMax}
          mode="translate"
          showX={false}
          showY={false}
          showZ={true}
          onMouseDown={() => { isDraggingRef.current = true; }}
          onMouseUp={() => { isDraggingRef.current = false; }}
          onChange={handleAxialMax}
        />
      )}
      {coronalMin && (
        <TransformControls
          object={coronalMin}
          mode="translate"
          showX={false}
          showY={true}
          showZ={false}
          onMouseDown={() => { isDraggingRef.current = true; }}
          onMouseUp={() => { isDraggingRef.current = false; }}
          onChange={handleCoronalMin}
        />
      )}
      {coronalMax && (
        <TransformControls
          object={coronalMax}
          mode="translate"
          showX={false}
          showY={true}
          showZ={false}
          onMouseDown={() => { isDraggingRef.current = true; }}
          onMouseUp={() => { isDraggingRef.current = false; }}
          onChange={handleCoronalMax}
        />
      )}
      {sagittalMin && (
        <TransformControls
          object={sagittalMin}
          mode="translate"
          showX={true}
          showY={false}
          showZ={false}
          onMouseDown={() => { isDraggingRef.current = true; }}
          onMouseUp={() => { isDraggingRef.current = false; }}
          onChange={handleSagittalMin}
        />
      )}
      {sagittalMax && (
        <TransformControls
          object={sagittalMax}
          mode="translate"
          showX={true}
          showY={false}
          showZ={false}
          onMouseDown={() => { isDraggingRef.current = true; }}
          onMouseUp={() => { isDraggingRef.current = false; }}
          onChange={handleSagittalMax}
        />
      )}
    </>
  );
}
