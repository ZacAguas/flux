/**
 * SliceInteractionHandler Component
 *
 * Handles multi-modal interactions on 2D slice views:
 * - Left-click drag: Update crosshair positions
 * - Middle-click or Ctrl+left-click drag: Pan view
 * - Right-click drag: Adjust window/level
 * - Mouse wheel: Zoom in/out
 * Renders invisible overlay divs over each slice viewport to capture pointer events.
 */

import { useRef, useState, useEffect } from 'react';
import { useViewerStore } from '../../store/viewerStore';
import {
  pixelToVoxelIndices,
  getViewportBounds,
} from '../../utils/sliceInteraction';
import { getSliceDimensions } from '../../utils/layout';
import type { SliceOrientation } from '../../types/layout';

type InteractionMode = 'crosshair' | 'pan' | 'windowLevel';

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
  const sliceCameraState = useViewerStore((state) => state.sliceCameraState);
  const windowLevel = useViewerStore((state) => state.windowLevel);
  const setSliceIndex = useViewerStore((state) => state.setSliceIndex);
  const setSliceCamera = useViewerStore((state) => state.setSliceCamera);
  const setWindowLevel = useViewerStore((state) => state.setWindowLevel);
  const markDirty = useViewerStore((state) => state.markDirty);

  const [isDragging, setIsDragging] = useState(false);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('crosshair');
  const [activeOrientation, setActiveOrientation] = useState<SliceOrientation | null>(null);
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null);
  const [dragStartCameraState, setDragStartCameraState] = useState<{ panX: number; panY: number; zoom: number } | null>(null);
  const [dragStartWindowLevel, setDragStartWindowLevel] = useState<{ center: number; width: number } | null>(null);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  // Container ref to get bounding rect for coordinate conversion
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs for individual slice overlays to attach non-passive event listeners
  const axialRef = useRef<HTMLDivElement>(null);
  const coronalRef = useRef<HTMLDivElement>(null);
  const sagittalRef = useRef<HTMLDivElement>(null);

  // Track Ctrl key for pan mode indication
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setIsCtrlPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setIsCtrlPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

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

    const cameraState = sliceCameraState[orientation];
    const result = pixelToVoxelIndices(pixelX, pixelY, orientation, volume, viewport, cameraState);

    // Update the two orthogonal slice indices
    setSliceIndex(result.orientation1, result.index1);
    setSliceIndex(result.orientation2, result.index2);
  };

  /**
   * Handle pointer down - start interaction and determine mode
   */
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    orientation: SliceOrientation
  ) => {
    if (!volume) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    setActiveOrientation(orientation);
    setDragStartPosition({ x: e.clientX, y: e.clientY });

    // Determine interaction mode based on mouse button and modifiers
    let mode: InteractionMode = 'crosshair';

    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      // Middle button or Ctrl+left button = pan
      mode = 'pan';
      const cameraState = sliceCameraState[orientation];
      setDragStartCameraState({
        panX: cameraState.panX,
        panY: cameraState.panY,
        zoom: cameraState.zoom,
      });
    } else if (e.button === 2) {
      // Right button = window/level
      mode = 'windowLevel';
      setDragStartWindowLevel({
        center: windowLevel.center,
        width: windowLevel.width,
      });
      e.preventDefault(); // Prevent context menu
    } else if (e.button === 0) {
      // Left button only = crosshair
      mode = 'crosshair';
      updateSliceIndicesFromPointer(e.clientX, e.clientY, orientation);
    }

    setInteractionMode(mode);
    setIsDragging(true);
  };

  /**
   * Handle pan drag - translate camera view
   */
  const handlePanDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeOrientation || !dragStartPosition || !dragStartCameraState) return;

    const viewport = getViewportBounds(
      layoutMode,
      activeOrientation,
      canvasWidth,
      canvasHeight,
      panelHeight
    );

    // Calculate pixel delta
    const deltaX = e.clientX - dragStartPosition.x;
    const deltaY = e.clientY - dragStartPosition.y;

    // Convert pixel delta to world space delta (accounting for zoom)
    const cameraState = sliceCameraState[activeOrientation];
    const viewportAspect = viewport.width / viewport.height;
    const sliceDims = getSliceDimensions(volume!, activeOrientation);
    const sliceAspect = sliceDims.width / sliceDims.height;
    const isHorizontal = sliceAspect > viewportAspect;
    const baseZoomFactor = isHorizontal ? sliceDims.width / 2 : sliceDims.height / 2 * viewportAspect;
    const zoomFactor = baseZoomFactor / cameraState.zoom;

    // World space units per pixel
    const worldPerPixelX = (2 * zoomFactor) / viewport.width;
    const worldPerPixelY = (2 * zoomFactor / viewportAspect) / viewport.height;

    // Update pan (negative delta because we're moving the view opposite to drag direction)
    setSliceCamera(activeOrientation, {
      panX: dragStartCameraState.panX - deltaX * worldPerPixelX,
      panY: dragStartCameraState.panY + deltaY * worldPerPixelY,
    });
  };

  /**
   * Handle window/level drag - adjust brightness/contrast
   */
  const handleWindowLevelDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartPosition || !dragStartWindowLevel || !volume) return;

    const deltaX = e.clientX - dragStartPosition.x;
    const deltaY = e.clientY - dragStartPosition.y;

    // Sensitivity factors (adjust these for desired responsiveness)
    const widthSensitivity = (volume.dataRange.max - volume.dataRange.min) / 500;
    const centerSensitivity = (volume.dataRange.max - volume.dataRange.min) / 500;

    // Horizontal drag adjusts width, vertical drag adjusts center
    const newWidth = Math.max(1, dragStartWindowLevel.width + deltaX * widthSensitivity);
    const newCenter = dragStartWindowLevel.center - deltaY * centerSensitivity;

    setWindowLevel({
      width: newWidth,
      center: newCenter,
    });
  };

  /**
   * Handle pointer move - dispatch to appropriate handler based on mode
   */
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !activeOrientation || !volume) return;

    if (interactionMode === 'crosshair') {
      updateSliceIndicesFromPointer(e.clientX, e.clientY, activeOrientation);
    } else if (interactionMode === 'pan') {
      handlePanDrag(e);
    } else if (interactionMode === 'windowLevel') {
      handleWindowLevelDrag(e);
    }
  };

  /**
   * Handle pointer up - end interaction
   */
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    // Mark dirty for window/level and crosshair (slice index) changes
    if (interactionMode === 'windowLevel' || interactionMode === 'crosshair') {
      markDirty();
    }

    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    setInteractionMode('crosshair');
    setActiveOrientation(null);
    setDragStartPosition(null);
    setDragStartCameraState(null);
    setDragStartWindowLevel(null);
  };

  /**
   * Handle mouse wheel - zoom in/out
   */
  const handleWheel = (
    e: WheelEvent,
    orientation: SliceOrientation
  ) => {
    if (!volume || !containerRef.current) return;

    e.preventDefault();

    const cameraState = sliceCameraState[orientation];
    const rect = containerRef.current.getBoundingClientRect();
    const pixelX = e.clientX - rect.left;
    const pixelY = e.clientY - rect.top;

    const viewport = getViewportBounds(
      layoutMode,
      orientation,
      canvasWidth,
      canvasHeight,
      panelHeight
    );

    // Calculate zoom delta (exponential zoom feels more natural)
    const zoomDelta = Math.pow(1.1, -e.deltaY / 100);
    const newZoom = Math.max(0.1, Math.min(20, cameraState.zoom * zoomDelta));

    // Convert mouse position to world space coordinates before zoom
    const viewportAspect = viewport.width / viewport.height;
    const sliceDims = getSliceDimensions(volume, orientation);
    const sliceAspect = sliceDims.width / sliceDims.height;
    const isHorizontal = sliceAspect > viewportAspect;
    const baseZoomFactor = isHorizontal ? sliceDims.width / 2 : sliceDims.height / 2 * viewportAspect;
    const zoomFactor = baseZoomFactor / cameraState.zoom;

    // Mouse position in viewport coordinates (0 to 1)
    const viewportMouseX = (pixelX - viewport.x) / viewport.width;
    const viewportMouseY = (pixelY - viewport.y) / viewport.height;

    // Mouse position in NDC (-1 to 1)
    const ndcX = viewportMouseX * 2 - 1;
    const ndcY = -(viewportMouseY * 2 - 1);

    // Mouse position in world space
    const worldX = ndcX * zoomFactor + cameraState.panX;
    const worldY = ndcY * (zoomFactor / viewportAspect) + cameraState.panY;

    // Calculate new pan to keep mouse position stationary
    const zoomRatio = newZoom / cameraState.zoom;
    const newPanX = worldX - (worldX - cameraState.panX) / zoomRatio;
    const newPanY = worldY - (worldY - cameraState.panY) / zoomRatio;

    setSliceCamera(orientation, {
      zoom: newZoom,
      panX: newPanX,
      panY: newPanY,
    });
  };

  // Use a ref to keep the latest handleWheel callback available for the effect
  const handleWheelRef = useRef(handleWheel);
  handleWheelRef.current = handleWheel;

  /**
   * HACK: Manually attach wheel event listeners with { passive: false }.
   * React's onWheel prop uses passive listeners by default in most browsers,
   * which prevents e.preventDefault() from stopping page scroll during zoom.
   * See: https://github.com/facebook/react/issues/22794
   */
  useEffect(() => {
    const options = { passive: false };

    const onAxialWheel = (e: WheelEvent) => handleWheelRef.current(e, 'axial');
    const onCoronalWheel = (e: WheelEvent) => handleWheelRef.current(e, 'coronal');
    const onSagittalWheel = (e: WheelEvent) => handleWheelRef.current(e, 'sagittal');

    const axialEl = axialRef.current;
    const coronalEl = coronalRef.current;
    const sagittalEl = sagittalRef.current;

    if (axialEl) axialEl.addEventListener('wheel', onAxialWheel, options);
    if (coronalEl) coronalEl.addEventListener('wheel', onCoronalWheel, options);
    if (sagittalEl) sagittalEl.addEventListener('wheel', onSagittalWheel, options);

    return () => {
      if (axialEl) axialEl.removeEventListener('wheel', onAxialWheel);
      if (coronalEl) coronalEl.removeEventListener('wheel', onCoronalWheel);
      if (sagittalEl) sagittalEl.removeEventListener('wheel', onSagittalWheel);
    };
  }, []);

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

  // Determine cursor based on current mode and modifiers
  const getCursor = (): string => {
    if (isDragging) {
      if (interactionMode === 'pan') return 'grabbing';
      if (interactionMode === 'windowLevel') return 'ns-resize';
      return 'grabbing';
    }
    // Show cursor preview based on Ctrl key
    if (isCtrlPressed) return 'grab';
    return 'crosshair';
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    cursor: getCursor(),
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
        ref={axialRef}
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
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Coronal slice overlay */}
      <div
        ref={coronalRef}
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
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Sagittal slice overlay */}
      <div
        ref={sagittalRef}
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
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
