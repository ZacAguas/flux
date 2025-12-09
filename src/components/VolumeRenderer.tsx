/**
 * Volume Renderer Component
 *
 * Renders 3D medical imaging volumes using GPU-accelerated raymarching.
 * Integrates with @react-three/fiber and three/webgpu.
 */

import { useFrame } from '@react-three/fiber';
import { useVolumeSetup } from '../hooks/useVolumeSetup';

/**
 * Component to render the 3D volume using the shared setup hook.
 * Used primarily in the Single Layout view.
 */
export function VolumeRenderer() {
  const { mesh, updateCameraUniforms, volumeDimensions } = useVolumeSetup();

  // Update camera uniforms every frame
  useFrame(({ camera }) => {
    updateCameraUniforms(camera);
  });

  if (!mesh || !volumeDimensions) {
    return null;
  }

  // We can use the mesh created by the hook directly
  return (
    <primitive object={mesh} />
  );
}