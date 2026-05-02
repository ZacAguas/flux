/**
 * Crosshairs Overlay Component
 *
 * Displays crosshair lines on slice views showing where slice planes intersect.
 */

import { useEffect, useState } from 'react';
import { useViewerStore } from '../../store/viewerStore';
import {
  calculateCrosshairPositions,
  type CrosshairPosition,
} from '../../utils/sliceInteraction';

interface CrosshairsProps {
  layoutMode: 'quad' | 'slices';
  canvasWidth: number;
  canvasHeight: number;
}

type SliceOrientation = 'axial' | 'coronal' | 'sagittal';

interface ViewportStyle {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function Crosshairs({ layoutMode, canvasWidth, canvasHeight }: CrosshairsProps) {
  const volume = useViewerStore((state) => state.volume);
  const sliceIndices = useViewerStore((state) => state.sliceIndices);
  const sliceCameraState = useViewerStore((state) => state.sliceCameraState);
  const showCrosshairs = useViewerStore((state) => state.showCrosshairs);
  const crosshairSettings = useViewerStore((state) => state.crosshairSettings);

  const [positions, setPositions] = useState<{
    axial: CrosshairPosition | null;
    coronal: CrosshairPosition | null;
    sagittal: CrosshairPosition | null;
  }>({ axial: null, coronal: null, sagittal: null });

  // Calculate viewport bounds for clipping crosshairs
  const getViewportStyles = (orientation: SliceOrientation): ViewportStyle => {
    if (layoutMode === 'quad') {
      const halfWidth = canvasWidth / 2;
      const halfHeight = canvasHeight / 2;
      switch (orientation) {
        case 'axial':
          return { left: 0, top: 0, width: halfWidth, height: halfHeight };
        case 'coronal':
          return { left: halfWidth, top: 0, width: halfWidth, height: halfHeight };
        case 'sagittal':
          return { left: 0, top: halfHeight, width: halfWidth, height: halfHeight };
      }
    } else {
      const thirdWidth = canvasWidth / 3;
      switch (orientation) {
        case 'axial':
          return { left: 0, top: 0, width: thirdWidth, height: canvasHeight };
        case 'coronal':
          return { left: thirdWidth, top: 0, width: thirdWidth, height: canvasHeight };
        case 'sagittal':
          return { left: thirdWidth * 2, top: 0, width: thirdWidth, height: canvasHeight };
      }
    }
  };

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
          { x: 0, y: 0, width: halfWidth, height: halfHeight }, sliceCameraState.axial),
        coronal: calculateCrosshairPositions('coronal', sliceIndices, volume,
          { x: halfWidth, y: 0, width: halfWidth, height: halfHeight }, sliceCameraState.coronal),
        sagittal: calculateCrosshairPositions('sagittal', sliceIndices, volume,
          { x: 0, y: halfHeight, width: halfWidth, height: halfHeight }, sliceCameraState.sagittal),
      });
    } else if (layoutMode === 'slices') {
      const thirdWidth = canvasWidth / 3;

      setPositions({
        axial: calculateCrosshairPositions('axial', sliceIndices, volume,
          { x: 0, y: 0, width: thirdWidth, height: canvasHeight }, sliceCameraState.axial),
        coronal: calculateCrosshairPositions('coronal', sliceIndices, volume,
          { x: thirdWidth, y: 0, width: thirdWidth, height: canvasHeight }, sliceCameraState.coronal),
        sagittal: calculateCrosshairPositions('sagittal', sliceIndices, volume,
          { x: thirdWidth * 2, y: 0, width: thirdWidth, height: canvasHeight }, sliceCameraState.sagittal),
      });
    }
  }, [volume, sliceIndices, sliceCameraState, showCrosshairs, layoutMode, canvasWidth, canvasHeight]);

  if (!showCrosshairs || !volume) return null;

  const lineStyle = {
    backgroundColor: crosshairSettings.color,
    opacity: crosshairSettings.opacity,
    pointerEvents: 'none' as const,
  };

  // Helper to render a single crosshair with viewport clipping
  const renderCrosshair = (orientation: SliceOrientation, position: CrosshairPosition) => {
    const viewport = getViewportStyles(orientation);

    return (
      <div
        key={orientation}
        style={{
          position: 'absolute',
          left: `${viewport.left}px`,
          top: `${viewport.top}px`,
          width: `${viewport.width}px`,
          height: `${viewport.height}px`,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {/* Vertical line */}
        <div style={{
          ...lineStyle,
          position: 'absolute',
          left: `${position.vertical - viewport.left}px`,
          top: 0,
          bottom: 0,
          width: '1px',
        }} />
        {/* Horizontal line */}
        <div style={{
          ...lineStyle,
          position: 'absolute',
          top: `${position.horizontal - viewport.top}px`,
          left: 0,
          right: 0,
          height: '1px',
        }} />
      </div>
    );
  };

  return (
    <>
      {positions.axial && renderCrosshair('axial', positions.axial)}
      {positions.coronal && renderCrosshair('coronal', positions.coronal)}
      {positions.sagittal && renderCrosshair('sagittal', positions.sagittal)}
    </>
  );
}
