/**
 * SliceInteractionHandler Component
 *
 * Handles click and drag interactions on 2D slice views to update crosshair positions.
 * Renders invisible overlay divs over each slice viewport to capture pointer events.
 */

import { useRef, useState } from 'react';
import { useViewerStore } from '../../store/viewerStore';
import {
  pixelToVoxelIndices,
  getViewportBounds,
} from '../../utils/sliceInteraction';

interface SliceInteractionHandlerProps {
  layoutMode: 'quad' | 'slices';
  canvasWidth: number;
  canvasHeight: number;
  panelHeight: number;
}

export function SliceInteractionHandler({
  layoutMode,
  canvasWidth,
  canvasHeight,
  panelHeight,
}: SliceInteractionHandlerProps) {
  const volume = useViewerStore((state) => state.volume);
  const setSliceIndex = useViewerStore((state) => state.setSliceIndex);

  const [isDragging, setIsDragging] = useState(false);
  const [activeOrientation, setActiveOrientation] = useState<
    'axial' | 'coronal' | 'sagittal' | null
  >(null);

  // Container ref to get bounding rect for coordinate conversion
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Convert pointer event coordinates to slice indices and update store
   */
  const updateSliceIndicesFromPointer = (
    clientX: number,
    clientY: number,
    orientation: 'axial' | 'coronal' | 'sagittal'
  ) => {
    if (!volume || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const pixelX = clientX - rect.left;
    const pixelY = clientY - rect.top;

    const viewport = getViewportBounds(
      layoutMode,
      orientation,
      canvasWidth,
      canvasHeight,
      panelHeight
    );

    const result = pixelToVoxelIndices(pixelX, pixelY, orientation, volume, viewport);

    // Update the two orthogonal slice indices
    setSliceIndex(result.orientation1, result.index1);
    setSliceIndex(result.orientation2, result.index2);
  };

  /**
   * Handle pointer down - start interaction
   */
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    orientation: 'axial' | 'coronal' | 'sagittal'
  ) => {
    if (!volume) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setActiveOrientation(orientation);

    updateSliceIndicesFromPointer(e.clientX, e.clientY, orientation);
  };

  /**
   * Handle pointer move - update during drag
   */
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !activeOrientation || !volume) return;

    updateSliceIndicesFromPointer(e.clientX, e.clientY, activeOrientation);
  };

  /**
   * Handle pointer up - end interaction
   */
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    setActiveOrientation(null);
  };

  if (!volume) return null;

  // Calculate viewport positions for overlay divs
  const axialViewport = getViewportBounds(
    layoutMode,
    'axial',
    canvasWidth,
    canvasHeight,
    panelHeight
  );
  const coronalViewport = getViewportBounds(
    layoutMode,
    'coronal',
    canvasWidth,
    canvasHeight,
    panelHeight
  );
  const sagittalViewport = getViewportBounds(
    layoutMode,
    'sagittal',
    canvasWidth,
    canvasHeight,
    panelHeight
  );

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    cursor: isDragging ? 'grabbing' : 'crosshair',
    pointerEvents: 'auto',
    zIndex: 2, // Above volume viewport div, below UI labels
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Container doesn't capture events
      }}
    >
      {/* Axial slice overlay */}
      <div
        style={{
          ...overlayStyle,
          left: `${axialViewport.x}px`,
          top: `${axialViewport.y}px`,
          width: `${axialViewport.width}px`,
          height: `${axialViewport.height}px`,
        }}
        onPointerDown={(e) => handlePointerDown(e, 'axial')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {/* Coronal slice overlay */}
      <div
        style={{
          ...overlayStyle,
          left: `${coronalViewport.x}px`,
          top: `${coronalViewport.y}px`,
          width: `${coronalViewport.width}px`,
          height: `${coronalViewport.height}px`,
        }}
        onPointerDown={(e) => handlePointerDown(e, 'coronal')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {/* Sagittal slice overlay */}
      <div
        style={{
          ...overlayStyle,
          left: `${sagittalViewport.x}px`,
          top: `${sagittalViewport.y}px`,
          width: `${sagittalViewport.width}px`,
          height: `${sagittalViewport.height}px`,
        }}
        onPointerDown={(e) => handlePointerDown(e, 'sagittal')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
}
