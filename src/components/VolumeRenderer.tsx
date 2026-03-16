/**
 * Volume Renderer Component
 *
 * Renders 3D medical imaging volumes using GPU-accelerated raymarching.
 * Integrates with @react-three/fiber and three/webgpu.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useVolumeSetup } from '../hooks/useVolumeSetup';
import { useCropBoxInVolume } from '../hooks/useCropBoxInVolume';
import { CropBoxGizmos } from './CropBoxGizmos';

/**
 * Component to render the 3D volume using the shared setup hook.
 * Used primarily in the Single Layout view.
 */
export function VolumeRenderer() {
  const { mesh, updateCameraUniforms, volumeDimensions } = useVolumeSetup();
  const { scene } = useThree();

  const {
    axialMin,
    axialMax,
    coronalMin,
    coronalMax,
    sagittalMin,
    sagittalMax,
  } = useCropBoxInVolume(scene);

  // Update camera uniforms every frame
  useFrame(({ camera }) => {
    updateCameraUniforms(camera);
  });

  if (!mesh || !volumeDimensions) {
    return null;
  }

  return (
    <>
      <primitive object={mesh} />
      <CropBoxGizmos
        axialMin={axialMin}
        axialMax={axialMax}
        coronalMin={coronalMin}
        coronalMax={coronalMax}
        sagittalMin={sagittalMin}
        sagittalMax={sagittalMax}
      />
    </>
  );
}
