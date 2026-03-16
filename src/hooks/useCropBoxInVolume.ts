/**
 * Crop Box In Volume Hook
 *
 * Manages the crop box wireframe and invisible anchor objects used by the
 * gizmo handles (TransformControls needs scene-parented objects to attach to).
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three/webgpu';
import { useViewerStore } from '../store/viewerStore';
import { getVolumeDimensions } from '../utils/layout';

/**
 * Custom hook to add and manage crop box objects in a 3D scene.
 * @param scene The THREE.Scene where the objects should be added.
 */
export function useCropBoxInVolume(scene: THREE.Scene | undefined) {
  const volume = useViewerStore((state) => state.volume);
  const cropBox = useViewerStore((state) => state.cropBox);

  // Invisible anchor objects — gizmo attachment points, one per crop face
  const axialMinRef = useRef<THREE.Object3D | undefined>(undefined);
  const axialMaxRef = useRef<THREE.Object3D | undefined>(undefined);
  const coronalMinRef = useRef<THREE.Object3D | undefined>(undefined);
  const coronalMaxRef = useRef<THREE.Object3D | undefined>(undefined);
  const sagittalMinRef = useRef<THREE.Object3D | undefined>(undefined);
  const sagittalMaxRef = useRef<THREE.Object3D | undefined>(undefined);
  const wireframeRef = useRef<THREE.LineSegments | undefined>(undefined);

  // Create anchor objects and wireframe once per volume/scene
  useEffect(() => {
    if (!scene || !volume) return;

    // Create 6 invisible anchor points for gizmo attachment
    axialMinRef.current = new THREE.Object3D();
    axialMaxRef.current = new THREE.Object3D();
    coronalMinRef.current = new THREE.Object3D();
    coronalMaxRef.current = new THREE.Object3D();
    sagittalMinRef.current = new THREE.Object3D();
    sagittalMaxRef.current = new THREE.Object3D();

    // Create wireframe
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    // NOTE: BoxGeometry is only needed to generate edges, dispose immediately
    boxGeo.dispose();
    const wireframeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    const wireframe = new THREE.LineSegments(edgesGeo, wireframeMat);
    wireframeRef.current = wireframe;

    scene.add(axialMinRef.current);
    scene.add(axialMaxRef.current);
    scene.add(coronalMinRef.current);
    scene.add(coronalMaxRef.current);
    scene.add(sagittalMinRef.current);
    scene.add(sagittalMaxRef.current);
    scene.add(wireframe);

    return () => {
      scene.remove(axialMinRef.current!);
      scene.remove(axialMaxRef.current!);
      scene.remove(coronalMinRef.current!);
      scene.remove(coronalMaxRef.current!);
      scene.remove(sagittalMinRef.current!);
      scene.remove(sagittalMaxRef.current!);
      if (wireframeRef.current) scene.remove(wireframeRef.current);
      edgesGeo.dispose();
      wireframeMat.dispose();
    };
  }, [scene, volume]);

  // Update anchor positions and wireframe transform/visibility
  useEffect(() => {
    if (
      !volume ||
      !axialMinRef.current || !axialMaxRef.current ||
      !coronalMinRef.current || !coronalMaxRef.current ||
      !sagittalMinRef.current || !sagittalMaxRef.current
    ) return;

    const volDims = getVolumeDimensions(volume);

    axialMinRef.current.position.z = (cropBox.axial.min - 0.5) * volDims.depth;
    axialMaxRef.current.position.z = (cropBox.axial.max - 0.5) * volDims.depth;
    coronalMinRef.current.position.y = (cropBox.coronal.min - 0.5) * volDims.height;
    coronalMaxRef.current.position.y = (cropBox.coronal.max - 0.5) * volDims.height;
    sagittalMinRef.current.position.x = (cropBox.sagittal.min - 0.5) * volDims.width;
    sagittalMaxRef.current.position.x = (cropBox.sagittal.max - 0.5) * volDims.width;

    if (wireframeRef.current) {
      wireframeRef.current.scale.set(
        (cropBox.sagittal.max - cropBox.sagittal.min) * volDims.width,
        (cropBox.coronal.max - cropBox.coronal.min) * volDims.height,
        (cropBox.axial.max - cropBox.axial.min) * volDims.depth,
      );
      wireframeRef.current.position.set(
        ((cropBox.sagittal.min + cropBox.sagittal.max) / 2 - 0.5) * volDims.width,
        ((cropBox.coronal.min + cropBox.coronal.max) / 2 - 0.5) * volDims.height,
        ((cropBox.axial.min + cropBox.axial.max) / 2 - 0.5) * volDims.depth,
      );
      wireframeRef.current.visible = cropBox.enabled;
    }
  }, [cropBox, volume]);

  return {
    axialMin: axialMinRef.current,
    axialMax: axialMaxRef.current,
    coronalMin: coronalMinRef.current,
    coronalMax: coronalMaxRef.current,
    sagittalMin: sagittalMinRef.current,
    sagittalMax: sagittalMaxRef.current,
    wireframe: wireframeRef.current,
  };
}
