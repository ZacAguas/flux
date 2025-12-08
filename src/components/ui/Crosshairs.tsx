/**
 * Crosshairs Overlay Component
 *
 * Displays crosshair lines on slice views showing where slice planes intersect.
 */

import { useEffect, useState } from 'react';
import { useViewerStore } from '../../store/viewerStore';
import { calculateCrosshairPositions } from '../../utils/crosshairCalculations';

interface CrosshairPosition {
  horizontal: number;
  vertical: number;
}

interface CrosshairsProps {
  layoutMode: 'quad' | 'slices';
  canvasWidth: number;
  canvasHeight: number;
  panelHeight: number;
}

export function Crosshairs({ layoutMode, canvasWidth, canvasHeight, panelHeight }: CrosshairsProps) {
  const volume = useViewerStore((state) => state.volume);
  const sliceIndices = useViewerStore((state) => state.sliceIndices);
  const showCrosshairs = useViewerStore((state) => state.showCrosshairs);
  const crosshairSettings = useViewerStore((state) => state.crosshairSettings);

  const [positions, setPositions] = useState<{
    axial: CrosshairPosition | null;
    coronal: CrosshairPosition | null;
    sagittal: CrosshairPosition | null;
  }>({ axial: null, coronal: null, sagittal: null });

  useEffect(() => {
    if (!volume || !showCrosshairs) {
      setPositions({ axial: null, coronal: null, sagittal: null });
      return;
    }

    if (layoutMode === 'quad') {
      const halfWidth = canvasWidth / 2;
      const halfHeight = canvasHeight / 2;

      setPositions({
        axial: calculateCrosshairPositions('axial', sliceIndices, volume,
          { x: 0, y: 0, width: halfWidth, height: halfHeight }),
        coronal: calculateCrosshairPositions('coronal', sliceIndices, volume,
          { x: halfWidth, y: 0, width: halfWidth, height: halfHeight }),
        sagittal: calculateCrosshairPositions('sagittal', sliceIndices, volume,
          { x: 0, y: halfHeight, width: halfWidth, height: halfHeight }),
      });
    } else if (layoutMode === 'slices') {
      const thirdWidth = canvasWidth / 3;

      setPositions({
        axial: calculateCrosshairPositions('axial', sliceIndices, volume,
          { x: 0, y: 0, width: thirdWidth, height: canvasHeight }),
        coronal: calculateCrosshairPositions('coronal', sliceIndices, volume,
          { x: thirdWidth, y: 0, width: thirdWidth, height: canvasHeight }),
        sagittal: calculateCrosshairPositions('sagittal', sliceIndices, volume,
          { x: thirdWidth * 2, y: 0, width: thirdWidth, height: canvasHeight }),
      });
    }
  }, [volume, sliceIndices, showCrosshairs, layoutMode, canvasWidth, canvasHeight]);

  if (!showCrosshairs || !volume) return null;

  const lineStyle = {
    backgroundColor: crosshairSettings.color,
    opacity: crosshairSettings.opacity,
    pointerEvents: 'none' as const,
  };

  return (
    <>
      {/* Axial Crosshairs */}
      {positions.axial && (
        <>
          {/* Vertical line */}
          <div style={{
            ...lineStyle,
            position: 'absolute',
            left: `${positions.axial.vertical}px`,
            top: `${panelHeight}px`,
            bottom: layoutMode === 'quad' ? '50%' : 0,
            width: '1px',
          }} />
          {/* Horizontal line */}
          <div style={{
            ...lineStyle,
            position: 'absolute',
            top: `${panelHeight + positions.axial.horizontal}px`,
            left: 0,
            right: layoutMode === 'quad' ? '50%' : '66.66%',
            height: '1px',
          }} />
        </>
      )}

      {/* Coronal Crosshairs */}
      {positions.coronal && (
        <>
          <div style={{
            ...lineStyle,
            position: 'absolute',
            left: `${positions.coronal.vertical}px`,
            top: `${panelHeight}px`,
            bottom: layoutMode === 'quad' ? '50%' : 0,
            width: '1px',
          }} />
          <div style={{
            ...lineStyle,
            position: 'absolute',
            top: `${panelHeight + positions.coronal.horizontal}px`,
            left: layoutMode === 'quad' ? '50%' : '33.33%',
            right: layoutMode === 'quad' ? 0 : '33.33%',
            height: '1px',
          }} />
        </>
      )}

      {/* Sagittal Crosshairs */}
      {positions.sagittal && (
        <>
          <div style={{
            ...lineStyle,
            position: 'absolute',
            left: `${positions.sagittal.vertical}px`,
            top: layoutMode === 'quad' ? `${panelHeight + canvasHeight / 2}px` : `${panelHeight}px`,
            bottom: 0,
            width: '1px',
          }} />
          <div style={{
            ...lineStyle,
            position: 'absolute',
            top: `${panelHeight + positions.sagittal.horizontal}px`,
            left: layoutMode === 'quad' ? 0 : '66.66%',
            right: layoutMode === 'quad' ? '50%' : 0,
            height: '1px',
          }} />
        </>
      )}
    </>
  );
}
