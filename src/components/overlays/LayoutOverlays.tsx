import { useViewerStore } from '../../store/viewerStore';
import { useLayoutDimensions } from '../../hooks/useLayoutDimensions';
import { useLayoutContext } from '../../context/LayoutContext';
import { SliceInteractionHandler } from '../ui/SliceInteractionHandler';
import { Crosshairs } from '../ui/Crosshairs';
import { MetricOverlays } from '../ui/MetricOverlays';
import { MeasurementOverlay } from '../measurements/MeasurementOverlay';
import { useSliceViewKeyboardShortcuts } from '../../hooks/useSliceViewKeyboardShortcuts';
import { useMeasurementKeyboardShortcuts } from '../../hooks/useMeasurementKeyboardShortcuts';

interface OverlayProps {
  width: number;
  height: number;
  panelHeight: number;
  labelOffset: number;
}

function SingleOverlays({ width, height, panelHeight, labelOffset }: OverlayProps) {
  return (
    <>
      <div style={{
        position: 'absolute',
        top: `${labelOffset + 10}px`,
        left: '10px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        pointerEvents: 'none',
        transition: 'top 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        3D Volume
      </div>
      <MetricOverlays
        layoutMode="single"
        canvasWidth={width}
        canvasHeight={height}
        panelHeight={panelHeight}
      />
    </>
  );
}

function SlicesOverlays({ width, height, panelHeight, labelOffset }: OverlayProps) {
  // Enable keyboard shortcuts
  useSliceViewKeyboardShortcuts();
  useMeasurementKeyboardShortcuts();

  return (
    <>
      <SliceInteractionHandler
        layoutMode="slices"
        canvasWidth={width}
        canvasHeight={height}
        panelHeight={panelHeight}
      />

      {/* Labels */}
      <div style={{ position: 'absolute', top: `${labelOffset + 10}px`, left: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none', transition: 'top 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}>Axial</div>
      <div style={{ position: 'absolute', top: `${labelOffset + 10}px`, left: '33.33%', marginLeft: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none', transition: 'top 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}>Coronal</div>
      <div style={{ position: 'absolute', top: `${labelOffset + 10}px`, left: '66.66%', marginLeft: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none', transition: 'top 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}>Sagittal</div>

      {/* Dividers */}
      <div style={{ position: 'absolute', top: `${panelHeight}px`, bottom: 0, left: '33.33%', width: '2px', backgroundColor: '#333', pointerEvents: 'none', transition: 'top 300ms cubic-bezier(0.4, 0, 0.2, 1)' }} />
      <div style={{ position: 'absolute', top: `${panelHeight}px`, bottom: 0, left: '66.66%', width: '2px', backgroundColor: '#333', pointerEvents: 'none', transition: 'top 300ms cubic-bezier(0.4, 0, 0.2, 1)' }} />

      <Crosshairs
        layoutMode="slices"
        canvasWidth={width}
        canvasHeight={height}
        panelHeight={panelHeight}
      />
      <MeasurementOverlay
        layoutMode="slices"
        canvasWidth={width}
        canvasHeight={height}
        panelHeight={panelHeight}
      />
      <MetricOverlays
        layoutMode="slices"
        canvasWidth={width}
        canvasHeight={height}
        panelHeight={panelHeight}
      />
    </>
  );
}

function QuadOverlays({ width, height, panelHeight, labelOffset }: OverlayProps) {
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
          top: `calc(50% + ${panelHeight / 2}px)`,
          width: '50%',
          height: '50%',
          pointerEvents: 'auto',
          zIndex: 1,
          transition: 'top 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      <SliceInteractionHandler
        layoutMode="quad"
        canvasWidth={width}
        canvasHeight={height}
        panelHeight={panelHeight}
      />

      {/* Labels */}
      <div style={{ position: 'absolute', top: `${labelOffset + 10}px`, left: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none', transition: 'top 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}>Axial</div>
      <div style={{ position: 'absolute', top: `${labelOffset + 10}px`, right: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none', transition: 'top 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}>Coronal</div>
      <div style={{ position: 'absolute', top: `calc(50% + ${panelHeight / 2}px)`, left: '10px', marginTop: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none', transition: 'top 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}>Sagittal</div>
      <div style={{ position: 'absolute', top: `calc(50% + ${panelHeight / 2}px)`, right: '10px', marginTop: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none', transition: 'top 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}>3D Volume</div>

      {/* Grid Lines */}
      <div style={{ position: 'absolute', top: `calc(50% + ${panelHeight / 2}px)`, left: 0, right: 0, height: '2px', backgroundColor: '#333', pointerEvents: 'none', transition: 'top 300ms cubic-bezier(0.4, 0, 0.2, 1)' }} />
      <div style={{ position: 'absolute', top: `${panelHeight}px`, bottom: 0, left: '50%', width: '2px', backgroundColor: '#333', pointerEvents: 'none', transition: 'top 300ms cubic-bezier(0.4, 0, 0.2, 1)' }} />

      <Crosshairs
        layoutMode="quad"
        canvasWidth={width}
        canvasHeight={height}
        panelHeight={panelHeight}
      />
      <MeasurementOverlay
        layoutMode="quad"
        canvasWidth={width}
        canvasHeight={height}
        panelHeight={panelHeight}
      />
      <MetricOverlays
        layoutMode="quad"
        canvasWidth={width}
        canvasHeight={height}
        panelHeight={panelHeight}
      />
    </>
  );
}

export function LayoutOverlays() {
  const layoutMode = useViewerStore((state) => state.layoutMode);
  const { dimensions, panelHeight, controlPanelContentHeight, controlPanelOpen } = useLayoutDimensions();
  const labelOffset = controlPanelOpen ? controlPanelContentHeight : 0;

  const props = {
    width: dimensions.width,
    height: dimensions.height,
    panelHeight,
    labelOffset
  };

  if (layoutMode === 'single') return <SingleOverlays {...props} />;
  if (layoutMode === 'slices') return <SlicesOverlays {...props} />;
  if (layoutMode === 'quad') return <QuadOverlays {...props} />;
  return null;
}
