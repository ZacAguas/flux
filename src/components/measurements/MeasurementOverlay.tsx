/**
 * MeasurementOverlay Component
 *
 * Container component that renders SVG overlays for measurements on slice viewports.
 * Follows the same pattern as Crosshairs.tsx - absolute positioned containers
 * clipped to each viewport.
 */

import { useViewerStore } from '../../store/viewerStore';
import { getViewportBounds, type ViewportBounds } from '../../utils/sliceInteraction';
import { DistanceMeasurement } from './DistanceMeasurement';
import { AngleMeasurement } from './AngleMeasurement';
import type { SliceOrientation } from '../../types/layout';
import type { Measurement, DistanceMeasurement as DistanceMeasurementType, AngleMeasurement as AngleMeasurementType } from '../../types/measurement';

interface MeasurementOverlayProps {
  layoutMode: 'quad' | 'slices';
  canvasWidth: number;
  canvasHeight: number;
  panelHeight: number;
}

interface ViewportOverlayProps {
  orientation: SliceOrientation;
  viewport: ViewportBounds;
  measurements: Measurement[];
  selectedMeasurementId: string | null;
  onSelect: (id: string | null) => void;
}

function ViewportMeasurements({
  orientation,
  viewport,
  measurements,
  selectedMeasurementId,
  onSelect,
}: ViewportOverlayProps) {
  const volume = useViewerStore((state) => state.volume);
  const sliceCameraState = useViewerStore((state) => state.sliceCameraState);
  const sliceIndices = useViewerStore((state) => state.sliceIndices);

  if (!volume) return null;

  const cameraState = sliceCameraState[orientation];
  const currentSliceIndex = sliceIndices[orientation];

  // Filter measurements for this orientation and current slice
  const visibleMeasurements = measurements.filter((m) => {
    if (m.orientation !== orientation) return false;
    // Show measurement if it's on the current slice (exact match)
    // NOTE: For now, only show exact matches - could add tolerance for thick slices later
    return m.sliceIndex === currentSliceIndex;
  });

  if (visibleMeasurements.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${viewport.x}px`,
        top: `${viewport.y}px`,
        width: `${viewport.width}px`,
        height: `${viewport.height}px`,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 3, // Above SliceInteractionHandler (z-index: 2) for measurement selection
      }}
    >
      <svg
        width={viewport.width}
        height={viewport.height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none', // Children with explicit pointer-events can still receive events
        }}
      >
        {visibleMeasurements.map((measurement) => {
          if (measurement.type === 'distance') {
            return (
              <DistanceMeasurement
                key={measurement.id}
                measurement={measurement as DistanceMeasurementType}
                volume={volume}
                viewport={viewport}
                cameraState={cameraState}
                isSelected={measurement.id === selectedMeasurementId}
                onSelect={onSelect}
              />
            );
          } else if (measurement.type === 'angle') {
            return (
              <AngleMeasurement
                key={measurement.id}
                measurement={measurement as AngleMeasurementType}
                volume={volume}
                viewport={viewport}
                cameraState={cameraState}
                isSelected={measurement.id === selectedMeasurementId}
                onSelect={onSelect}
              />
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
}

export function MeasurementOverlay({
  layoutMode,
  canvasWidth,
  canvasHeight,
  panelHeight,
}: MeasurementOverlayProps) {
  const volume = useViewerStore((state) => state.volume);
  const measurements = useViewerStore((state) => state.measurements);
  const showMeasurements = useViewerStore((state) => state.showMeasurements);
  const selectedMeasurementId = useViewerStore((state) => state.selectedMeasurementId);
  const setSelectedMeasurement = useViewerStore((state) => state.setSelectedMeasurement);

  if (!volume || !showMeasurements || measurements.length === 0) return null;

  // Calculate viewports for each orientation
  const orientations: SliceOrientation[] = ['axial', 'coronal', 'sagittal'];
  const viewports = orientations.map((orientation) =>
    getViewportBounds(layoutMode, orientation, canvasWidth, canvasHeight, panelHeight)
  );

  return (
    <>
      {orientations.map((orientation, index) => (
        <ViewportMeasurements
          key={orientation}
          orientation={orientation}
          viewport={viewports[index]}
          measurements={measurements}
          selectedMeasurementId={selectedMeasurementId}
          onSelect={setSelectedMeasurement}
        />
      ))}
    </>
  );
}
