/**
 * Volume Renderer Component
 *
 * Renders 3D medical imaging volumes using GPU-accelerated raymarching.
 * Integrates with @react-three/fiber and three/webgpu.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useVolumeSetup } from '../hooks/useVolumeSetup';
import { useClippingPlanesInVolume } from '../hooks/useClippingPlanesInVolume';
import { ClippingPlaneGizmos } from './ClippingPlaneGizmos';

/**
 * Component to render the 3D volume using the shared setup hook.
 * Used primarily in the Single Layout view.
 */
export function VolumeRenderer() {
  const { mesh, updateCameraUniforms, volumeDimensions } = useVolumeSetup();
  const { scene } = useThree();

  // Add clipping plane visualizations to the scene
  const { axialMesh, coronalMesh, sagittalMesh } = useClippingPlanesInVolume(scene);

  // Update camera uniforms every frame
  useFrame(({ camera }) => {
    updateCameraUniforms(camera);
  });

  if (!mesh || !volumeDimensions) {
    return null;
  }

  // We can use the mesh created by the hook directly
  return (
    <>
      <primitive object={mesh} />
      <ClippingPlaneGizmos
        axialMesh={axialMesh}
        coronalMesh={coronalMesh}
        sagittalMesh={sagittalMesh}
      />
    </>
  );
}