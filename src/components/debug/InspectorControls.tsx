import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useViewerStore } from '../../store/viewerStore';
import type { WebGPURenderer } from 'three/webgpu';
import type { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

export function InspectorControls() {
  const { gl } = useThree();
  const volume = useViewerStore((state) => state.volume);
  const windowLevel = useViewerStore((state) => state.windowLevel);
  const sliceIndices = useViewerStore((state) => state.sliceIndices);
  const setWindowLevel = useViewerStore((state) => state.setWindowLevel);
  const setSliceIndex = useViewerStore((state) => state.setSliceIndex);

  useEffect(() => {
    if (!import.meta.env.DEV || !volume) return;

    const inspector = (gl as unknown as WebGPURenderer).inspector as Inspector;
    if (!inspector) return;

    // Create parameters panel
    const gui = inspector.createParameters('Viewer Settings');

    // Window/Level controls
    const windowFolder = gui.addFolder('Window/Level');

    const params = {
      windowCenter: windowLevel.center,
      windowWidth: windowLevel.width,
      axialSlice: sliceIndices.axial,
      coronalSlice: sliceIndices.coronal,
      sagittalSlice: sliceIndices.sagittal,
    };

    windowFolder.add(params, 'windowCenter', volume.dataRange.min, volume.dataRange.max)
      .onChange((value: number) => {
        setWindowLevel({ center: value });
      });

    windowFolder.add(params, 'windowWidth', 1, volume.dataRange.max - volume.dataRange.min)
      .onChange((value: number) => {
        setWindowLevel({ width: value });
      });

    // Slice index controls
    const sliceFolder = gui.addFolder('Slice Indices');

    sliceFolder.add(params, 'axialSlice', 0, volume.dimensions.z - 1, 1)
      .onChange((value: number) => {
        setSliceIndex('axial', Math.floor(value));
      });

    sliceFolder.add(params, 'coronalSlice', 0, volume.dimensions.y - 1, 1)
      .onChange((value: number) => {
        setSliceIndex('coronal', Math.floor(value));
      });

    sliceFolder.add(params, 'sagittalSlice', 0, volume.dimensions.x - 1, 1)
      .onChange((value: number) => {
        setSliceIndex('sagittal', Math.floor(value));
      });

    // Cleanup
    return () => {
      // Inspector parameters don't have a dispose method, but they'll be cleaned up when inspector is disposed
    };
  }, [gl, volume, windowLevel, sliceIndices, setWindowLevel, setSliceIndex]);

  return null;
}
