import { useViewerStore } from '../../store/viewerStore';
import { useLayoutDimensions } from '../../hooks/useLayoutDimensions';
import { useLayoutContext } from '../../context/LayoutContext';
import { SliceInteractionHandler } from '../ui/SliceInteractionHandler';
import { Crosshairs } from '../ui/Crosshairs';
import { MetricOverlays } from '../ui/MetricOverlays';
import { MeasurementOverlay } from '../measurements/MeasurementOverlay';
import { TicOverlay } from './TicOverlay';
import { useSliceViewKeyboardShortcuts } from '../../hooks/useSliceViewKeyboardShortcuts';
import { useMeasurementKeyboardShortcuts } from '../../hooks/useMeasurementKeyboardShortcuts';

interface OverlayProps {
  width: number;
  height: number;
}

function SingleOverlays({ width, height }: OverlayProps) {
  return (
    <>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        pointerEvents: 'none',
      }}>
        3D Volume
      </div>
      <MetricOverlays
        layoutMode="single"
        canvasWidth={width}
        canvasHeight={height}
      />
    </>
  );
}

function SlicesOverlays({ width, height }: OverlayProps) {
  // Enable keyboard shortcuts
  useSliceViewKeyboardShortcuts();
  useMeasurementKeyboardShortcuts();

  return (
    <>
      <SliceInteractionHandler
        layoutMode="slices"
        canvasWidth={width}
        canvasHeight={height}
      />

      {/* Labels */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none' }}>Axial</div>
      <div style={{ position: 'absolute', top: '10px', left: '33.33%', marginLeft: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none' }}>Coronal</div>
      <div style={{ position: 'absolute', top: '10px', left: '66.66%', marginLeft: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none' }}>Sagittal</div>

      {/* Dividers */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '33.33%', width: '2px', backgroundColor: '#333', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '66.66%', width: '2px', backgroundColor: '#333', pointerEvents: 'none' }} />

      <Crosshairs
        layoutMode="slices"
        canvasWidth={width}
        canvasHeight={height}
      />
      <MeasurementOverlay
        layoutMode="slices"
        canvasWidth={width}
        canvasHeight={height}
      />
      <TicOverlay
        layoutMode="slices"
        canvasWidth={width}
        canvasHeight={height}
      />
      <MetricOverlays
        layoutMode="slices"
        canvasWidth={width}
        canvasHeight={height}
      />
    </>
  );
}

function QuadOverlays({ width, height }: OverlayProps) {
  const { volumeViewportRef } = useLayoutContext();
  useSliceViewKeyboardShortcuts();
  useMeasurementKeyboardShortcuts();

  return (
    <>
      {/* Volume Viewport Div for OrbitControls - Mounted into Context Ref */}
      <div
        ref={volumeViewportRef}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '50%',
          height: '50%',
          pointerEvents: 'auto',
          zIndex: 1,
        }}
      />

      <SliceInteractionHandler
        layoutMode="quad"
        canvasWidth={width}
        canvasHeight={height}
      />

      {/* Labels */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none' }}>Axial</div>
      <div style={{ position: 'absolute', top: '10px', right: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none' }}>Coronal</div>
      <div style={{ position: 'absolute', top: '50%', left: '10px', marginTop: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none' }}>Sagittal</div>
      <div style={{ position: 'absolute', top: '50%', right: '10px', marginTop: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none' }}>3D Volume</div>

      {/* Grid Lines */}
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', backgroundColor: '#333', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '2px', backgroundColor: '#333', pointerEvents: 'none' }} />

      <Crosshairs
        layoutMode="quad"
        canvasWidth={width}
        canvasHeight={height}
      />
      <MeasurementOverlay
        layoutMode="quad"
        canvasWidth={width}
        canvasHeight={height}
      />
      <TicOverlay
        layoutMode="quad"
        canvasWidth={width}
        canvasHeight={height}
      />
      <MetricOverlays
        layoutMode="quad"
        canvasWidth={width}
        canvasHeight={height}
      />
    </>
  );
}

export function LayoutOverlays() {
  const layoutMode = useViewerStore((state) => state.layoutMode);
  const { dimensions } = useLayoutDimensions();

  const props = {
    width: dimensions.width,
    height: dimensions.height,
  };

  if (layoutMode === 'single') return <SingleOverlays {...props} />;
  if (layoutMode === 'slices') return <SlicesOverlays {...props} />;
  if (layoutMode === 'quad') return <QuadOverlays {...props} />;
  return null;
}
