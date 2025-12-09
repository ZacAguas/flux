/**
 * Slices Layout Component
 *
 * Displays three orthogonal slice views (Axial, Coronal, Sagittal) in a 1x3 grid.
 * Uses manual scissor/viewport management to render multiple views on a single canvas.
 */

import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BaseLayout } from './BaseLayout';
import { useSliceViews } from '../../hooks/useSliceViews';
import { useLayoutDimensions } from '../../hooks/useLayoutDimensions';
import { SliceInteractionHandler } from '../ui/SliceInteractionHandler';
import { Crosshairs } from '../ui/Crosshairs';

/**
 * Internal component to handle the WebGL/WebGPU scissor rendering for slices.
 */
function SlicesRenderer() {
  const { gl, size } = useThree();
  const { axialScene, coronalScene, sagittalScene,
          axialCamera, coronalCamera, sagittalCamera, resizeCameras } = useSliceViews();

  useEffect(() => {
     resizeCameras(size.width / 3, size.height);
  }, [size, resizeCameras]);

  useFrame(() => {
    if (!axialScene || !coronalScene || !sagittalScene ||
        !axialCamera || !coronalCamera || !sagittalCamera) return;

    const width = size.width;
    const height = size.height;
    const thirdWidth = width / 3;

    gl.clear(true, true, true);

    // Axial (Left)
    gl.setViewport(0, 0, thirdWidth, height);
    gl.setScissor(0, 0, thirdWidth, height);
    gl.setScissorTest(true);
    gl.render(axialScene, axialCamera);

    // Coronal (Center)
    gl.setViewport(thirdWidth, 0, thirdWidth, height);
    gl.setScissor(thirdWidth, 0, thirdWidth, height);
    gl.render(coronalScene, coronalCamera);

    // Sagittal (Right)
    gl.setViewport(thirdWidth * 2, 0, thirdWidth, height);
    gl.setScissor(thirdWidth * 2, 0, thirdWidth, height);
    gl.render(sagittalScene, sagittalCamera);

    gl.setScissorTest(false);
  }, 1);

  return null;
}

/**
 * Layout showing only the 2D slice views.
 */
export function LayoutSlices() {
  const { dimensions, panelHeight, controlPanelOpen } = useLayoutDimensions();
  const labelOffset = controlPanelOpen ? 204 : 0;

  return (
    <BaseLayout panelHeight={panelHeight} overlays={
      <>
        {/* Interaction Handler */}
        <SliceInteractionHandler
          layoutMode="slices"
          canvasWidth={dimensions.width}
          canvasHeight={dimensions.height}
          panelHeight={panelHeight}
        />

        {/* Labels */}
        <div style={{ position: 'absolute', top: `${labelOffset + 10}px`, left: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none', transition: 'top 0.3s ease-in-out' }}>Axial</div>
        <div style={{ position: 'absolute', top: `${labelOffset + 10}px`, left: '33.33%', marginLeft: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none', transition: 'top 0.3s ease-in-out' }}>Coronal</div>
        <div style={{ position: 'absolute', top: `${labelOffset + 10}px`, left: '66.66%', marginLeft: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none', transition: 'top 0.3s ease-in-out' }}>Sagittal</div>

        {/* Dividers */}
        <div style={{ position: 'absolute', top: `${panelHeight}px`, bottom: 0, left: '33.33%', width: '2px', backgroundColor: '#333', pointerEvents: 'none', transition: 'top 0.3s ease-in-out' }} />
        <div style={{ position: 'absolute', top: `${panelHeight}px`, bottom: 0, left: '66.66%', width: '2px', backgroundColor: '#333', pointerEvents: 'none', transition: 'top 0.3s ease-in-out' }} />

        {/* Crosshairs */}
        <Crosshairs
          layoutMode="slices"
          canvasWidth={dimensions.width}
          canvasHeight={dimensions.height}
          panelHeight={panelHeight}
        />
      </>
    }>
      <SlicesRenderer />
    </BaseLayout>
  );
}